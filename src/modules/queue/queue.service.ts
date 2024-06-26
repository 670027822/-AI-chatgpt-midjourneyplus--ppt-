import { HttpException, HttpStatus, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Process, Processor, InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { MjDrawDto } from './dto/mjDraw.dto';
import { createRandomUid } from '@/common/utils';
import { MidjourneyService } from '../midjourney/midjourney.service';
import { MidjourneyActionEnum } from '@/common/constants/midjourney.constant';
import { Request } from 'express';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';

export class QueueService implements OnApplicationBootstrap {
  constructor(
    @InjectQueue('MJDRAW') private readonly mjDrawQueue: Queue,
    private readonly midjourneyService: MidjourneyService,
    private readonly userBalanceService: UserBalanceService,
    private readonly globalConfigService: GlobalConfigService,
  ) { }
  private readonly jobIds: any[] = [];

  async onApplicationBootstrap() {
    Logger.debug('服务启动时清除所有之前未执行完毕的队列任务！', 'QueueService');
    try {
      await this.mjDrawQueue.clean(0, 'active');
    } catch (error) {
      console.log(error)
    }
    /* 改变所有数据库状态不对的值 */
    await this.midjourneyService.cleanQueue();
  }

  /* 提交绘画任务 */
  async addMjDrawQueue(body: MjDrawDto, req: Request) {
    const { prompt, imgUrl, extraParam, orderId, action = 1, drawId } = body;
    /* 限制普通用户队列最多可以有两个任务在排队或者等待中 */
    await this.midjourneyService.checkLimit(req);
    /* 检测余额 */
    await this.userBalanceService.validateBalance(req, 'mjDraw', action === 2 ? 1 : 4);

    /* 绘图或者图生图 */
    if (action === MidjourneyActionEnum.DRAW || action === MidjourneyActionEnum.GENERATE) {
      /* 绘图或者图生图是相同的 区分一个action即可 */
      const randomDrawId = `${createRandomUid()}`;
      const params = { ...body, userId: req.user.id, randomDrawId };
      try {
        /* 添加绘制任务进入到db */
        console.log('params76767', params)
        const res = await this.midjourneyService.addDrawQueue(params);
        const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
        /* 添加任务到队列 通过imgUrl判断是不是图生图 */
        const job = await this.mjDrawQueue.add(
          'mjDraw',
          { id: res.id, action: imgUrl ? 4 : 1, userId: req.user.id },
          { delay: 1000, timeout: +timeout },
        );
        /* 绘图和图生图扣除余额4 */
        this.jobIds.push(job.id);
        /* 扣费 */
        await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
        return true;
      } catch (error) {
        console.log('error32424', error)
      }


    }

    /* 图片放大 */
    if (action === MidjourneyActionEnum.UPSCALE) {
      const { channel_id } = await this.midjourneyService.getMjDefaultParams();
      if (channel_id === '0') {
        //zhongzhuan
        const actionDetail: any = await this.midjourneyService.getDrawActionDetail2(drawId);
        const { custom_id } = actionDetail;
        /* 检测当前图片是不是已经放大过了 */
        await this.midjourneyService.checkIsUpscale(custom_id);

        const params = { ...body, userId: req.user.id, ...actionDetail, action, orderId };
        console.log('params', params);
        // 信息存储到数据库
        const res = await this.midjourneyService.addDrawQueue(params);
        const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
        const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
        /* 扣费 */
        await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 1, 1);
        this.jobIds.push(job.id);
        return;
      } else {
        //guanfang
        const actionDetail: any = await this.midjourneyService.getDrawActionDetail(action, drawId, orderId);

        const { custom_id } = actionDetail;
        /* 检测当前图片是不是已经放大过了 */
        await this.midjourneyService.checkIsUpscale(custom_id);
        const params = { ...body, userId: req.user.id, ...actionDetail };
        // 信息存储到数据库
        const res = await this.midjourneyService.addDrawQueue(params);
        const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
        // 添加到绘画队列
        const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
        /* 扣费 */
        await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 1, 1);
        this.jobIds.push(job.id);
        return;
      }


    };



    /* 图片变体 */
    if (action === MidjourneyActionEnum.VARIATION) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail2(drawId);
      const params = { ...body, userId: req.user.id, ...actionDetail, action, orderId };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      /* 扣费 */
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    }

    /* 重新生成 */
    if (action === MidjourneyActionEnum.REGENERATE) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail2(drawId);
      const params = { ...body, userId: req.user.id, ...actionDetail, action, orderId, drawId };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    }

    /* 对图片增强 Vary */
    if (action === 7 || action === 8) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail2(drawId);
      const params = { ...body, userId: req.user.id, ...actionDetail, action, orderId, drawId };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    }
    /* 对图片缩放 Zoom */
    if (action === 6 || action === 9) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail2(drawId);
      const params = { ...body, userId: req.user.id, ...actionDetail, action, orderId, drawId };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    };
    /* 对图片定向扩展 */
    if (action === 10 || action === 11 || action === 12 || action === 13) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetail2(drawId);
      const params = { ...body, userId: req.user.id, ...actionDetail, action, orderId, drawId };
      const res = await this.midjourneyService.addDrawQueue(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    };
    /* 对局部重绘 */
    if (action === 15) {
      const actionDetail: any = await this.midjourneyService.getDrawActionDetailch(drawId);
      const params = { ...body, userId: req.user.id, ...actionDetail, action, orderId, drawId };
      const res = await this.midjourneyService.addDrawQueuech(params);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 200000;
      const job = await this.mjDrawQueue.add('mjDraw', { id: res.id, action, userId: req.user.id }, { delay: 1000, timeout: +timeout });
      this.jobIds.push(job.id);
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', 4, 4);
      return;
    };

  }

  /* 查询队列 */
  async getQueue() {
    return { jobIds: this.jobIds };
  }
}
