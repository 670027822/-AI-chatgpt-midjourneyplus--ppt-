import { UserEntity } from './../user/user.entity';
import { HttpException, HttpStatus, Inject, Injectable, Logger, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MidjourneyEntity } from './midjourney.entity';
import { TishiciEntity } from './tishici.entity';
import { In, Repository } from 'typeorm';
import axios from 'axios';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { MidjourneyActionEnum, MidjourneyStatusEnum } from '@/common/constants/midjourney.constant';
import { UploadService } from '../upload/upload.service';
import { BadwordsService } from '../badwords/badwords.service';
import { Request } from 'express';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { GetListDto } from './dto/getList.dto';
import { formatCreateOrUpdateDate } from '@/common/utils';
import { RedisClientType } from 'redis';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { mjPromptEntity } from './prompt.entity';
import { errorMonitor } from 'events';
import { HuihuaegEntity } from './huihuaeg.entity';

const imageSize = require('image-size');

@Injectable()
export class MidjourneyService {
  constructor(
    @InjectRepository(MidjourneyEntity)
    private readonly midjourneyEntity: Repository<MidjourneyEntity>,
    @InjectRepository(TishiciEntity)
    private readonly tishiciEntity: Repository<TishiciEntity>,
    @InjectRepository(HuihuaegEntity)
    private readonly huihuaegEntity: Repository<HuihuaegEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(mjPromptEntity)
    private readonly mjPromptsEntity: Repository<mjPromptEntity>,
    private readonly globalConfigService: GlobalConfigService,
    private readonly uploadService: UploadService,
    private readonly badwordsService: BadwordsService,
    private readonly userBalanceService: UserBalanceService,
    private redisCacheService: RedisCacheService,
  ) { }

  private lockPrompt = [];

  async tishicihuoqu(params) {
    console.log('params54767', params);
    const tishici = await this.tishiciEntity.find({
 
      select: ['id', "name", 'fenlei', 'src'],
      where: { 'fenlei': params.fenlei },
      skip:params.skip,
      take:params.take
    });
    console.log(`这是第${params.skip}轮获取提示词`)

    return tishici

  }

  async huihuaeghuoqu() {

    const huihuaeg = await this.huihuaegEntity.find({ select: ['id', "name", 'prompt', 'src'] });
    return huihuaeg

  }



  /* 睡眠 xs */
  async sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async draw(jobData, jobId) {
    const { id, action } = jobData;
    const drawInfo = await this.midjourneyEntity.findOne({ where: { id } });
    const { channel_id, mjProxy } = await this.getMjDefaultParams();
    try {
      /* 把任务ID绑定到DB去 */
      await this.bindJobId(id, jobId);
      /* 修改绘画记录状态为绘制中 */
      await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWING);
      /* 绘制图片 | 图生图 */
      if (action === MidjourneyActionEnum.DRAW || action === MidjourneyActionEnum.GENERATE) {
        const res = await this.sendDrawCommand(drawInfo, jobData);
        console.log('056', res);
        /* 开始执行检测逻辑 */
        if (channel_id === '0') {
          console.log('中转通道3432');
          const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
          /* 把所有绘制记录存入 */
          await this.updateDrawData2(jobData, drawRes);
        } else {
          console.log('官方通道38462')

          const drawRes = await this.pollComparisonResultDraw(drawInfo);
          /* 把所有绘制记录存入 */
          await this.updateDrawData(jobData, drawRes);
        }
      }

      /* 放大图片 */
      if (action === MidjourneyActionEnum.UPSCALE) {
        const { message_id, custom_id, orderId, extend } = drawInfo;
        const res = await this.sendSmInteractions({ message_id, custom_id, orderId, extend }, jobData);
        Logger.debug(`记录${id}已经成功发送了图片放大指令`, 'MidjourneyService');
        /* 开始执行检测逻辑 */

        console.log('中转通道23423-fangda');
        const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
        /* 把所有绘制记录存入 */
        await this.updateDrawData2(jobData, drawRes);

      }

      /* 变体图片 */
      if (action === MidjourneyActionEnum.VARIATION) {
        const { message_id, custom_id, orderId, extend } = drawInfo;
        const res = await this.sendSmInteractions({ message_id, custom_id, orderId, extend }, jobData);
        Logger.debug(`记录${id}已经成功发送了图片变化指令`, 'MidjourneyService');
        /* 开始执行检测逻辑 */
        console.log('中转通道23423-bianti-jiance');
        const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
        /* 把所有绘制记录存入 */
        await this.updateDrawData2(jobData, drawRes);

      }

      /* 重新绘制一次 action=5 */
      if (action === MidjourneyActionEnum.REGENERATE) {
        const { message_id, custom_id, orderId = 5, extend } = drawInfo;
        const res = await this.sendSmInteractions99({ message_id, custom_id, orderId, extend }, jobData);
        Logger.debug(`记录${id}已经成功发送了重新生成图片指令`, 'MidjourneyService');
        // 开始执行检测逻辑
        console.log('中转通道23423-reshengch-jiance');
        const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
        /* 把所有绘制记录存入 */
        await this.updateDrawData2(jobData, drawRes);

      }

      /* 对图片增强  Vary */
      if (action === 7 || action === 8) {
        const { message_id, custom_id, orderId = 5, extend } = drawInfo;
        const res = await this.sendSmInteractions99({ message_id, custom_id, orderId, extend }, jobData);
        Logger.debug(`记录${id}已经成功发送单张图片增强指令`, 'MidjourneyService');
        const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
        /* 把所有绘制记录存入 */
        await this.updateDrawData2(jobData, drawRes);
      }

      /* 对图片缩放  Zoom */
      if (action === 6 || action === 9) {
        const { message_id, custom_id, orderId = 5, extend } = drawInfo;
        const res = await this.sendSmInteractions99({ message_id, custom_id, orderId, extend }, jobData);
        Logger.debug(`记录${id}已经成功发送单张图片缩放指令`, 'MidjourneyService');
        const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
        /* 把所有绘制记录存入 */
        await this.updateDrawData2(jobData, drawRes);
      };

      if (action === 10 || action === 11 || action === 12 || action === 13) {
        const { message_id, custom_id, orderId = 5, extend } = drawInfo;
        const res = await this.sendSmInteractionskt({ message_id, custom_id, orderId, extend }, jobData);
        Logger.debug(`记录${id}已经成功发送单张图片定向扩图`, 'MidjourneyService');
        const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
        /* 把所有绘制记录存入 */
        await this.updateDrawData2(jobData, drawRes);
      };

      if (action === 15) {
        const { imgUrl, prompt, custom_id, extend } = drawInfo;
        const res = await this.sendSmInteractionsch({ custom_id, extend, imgUrl, prompt }, jobData);
        Logger.debug(`记录${id}已经成功发送局部重绘`, 'MidjourneyService');
        const drawRes = await this.pollComparisonResultDraw2(drawInfo, res.data);
        /* 把所有绘制记录存入 */
        await this.updateDrawData2(jobData, drawRes);
      };


      return true;
    } catch (error) {
      this.lockPrompt = this.lockPrompt.filter((item) => item !== drawInfo.randomDrawId);
      console.log('2432434')
      await this.drawFailed(jobData);
      console.log('error73536: ', error);
      return true;
    }
  }

  /* 绘制图片 */
  /* 放大图片 */
  /* 变体图片 */

  /* 添加一条等待中的绘制任务 */
  async addDrawQueue(params) {
    const { prompt, imgUrl = '', extraParam = '', action = 1, userId, randomDrawId, orderId = 0, custom_id, message_id, drawId, extend, gk } = params;
    const fullPrompt = imgUrl ? `${imgUrl} ${prompt} ${extraParam}` : `${prompt} ${extraParam}`;
    /* 敏感词检测 */
    await this.badwordsService.checkBadWords(fullPrompt, userId);
    const drawInfo = {
      userId,
      extraParam,
      prompt,
      imgUrl,
      fullPrompt,
      randomDrawId,
      status: MidjourneyStatusEnum.WAITING,
      action: action,
      orderId,
      custom_id,
      message_id,
      extend,
      gk
    };
    const res = await this.midjourneyEntity.save(drawInfo);
    return res;
  };


  /* 添加一条等待中的绘制任务 */
  async addDrawQueuech(params) {
    const { prompt, maskBase64, extraParam = '', action = 1, userId, randomDrawId, orderId = 0, custom_id, message_id, drawId, extend } = params;
    const fullPrompt = `${prompt} ${extraParam}`;
    /* 敏感词检测 */
    await this.badwordsService.checkBadWords(fullPrompt, userId);
    const drawInfo = {
      userId,
      extraParam,
      prompt,
      imgUrl: maskBase64,
      fullPrompt,
      randomDrawId,
      status: MidjourneyStatusEnum.WAITING,
      action: action,
      orderId,
      custom_id,
      message_id,
      extend
    };
    try {
      const res = await this.midjourneyEntity.save(drawInfo);
      console.log(236432463)
      return res;
    } catch (error) {
      console.log('error34234234', error)
    }

  }









  /* 修改绘制记录状态 */
  async updateDrawStatus(id, status) {
    await this.midjourneyEntity.update({ id }, { status });
  }

  /* 绘制完成后修改数据 */
  async updateDrawData(jobData, drawRes) {
    try {
      const { id, content, channel_id, attachments = [], timestamp, durationSpent } = drawRes;
      const { filename, url, proxy_url, width, height, size } = attachments[0];
      /* 将图片存入cos */
      const mjNotSaveImg = await this.globalConfigService.getConfigs(['mjNotSaveImg']);
      let cosUrl = '';
      if (!Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0) {
        Logger.debug(`------> 开始上传图片！！！`, 'MidjourneyService');
        const startDate = new Date();
        cosUrl = await this.uploadService.uploadFileFromUrl({ filename, url });
        const endDate = new Date();
        Logger.debug(`本次图片上传耗时为${(endDate.getTime() - startDate.getTime()) / 1000}秒`, 'MidjourneyService');
      } else {
        console.log('本次不存图片了');
      }
      /* 记录当前图片存储方式 方便后续对不同平台图片压缩 */
      const cosType = await this.uploadService.getUploadType();
      /* 整理信息 存入DB */
      const drawInfo = {
        status: MidjourneyStatusEnum.DRAWED,
        message_id: id,
        progress: 100,
        fileInfo: JSON.stringify({ width, height, size, filename, cosUrl, cosType }),
        extend: this.removeEmoji(JSON.stringify(drawRes)),
        durationSpent,
        isSaveImg: !Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0,
      };
      await this.midjourneyEntity.update({ id: jobData.id }, drawInfo);
    } catch (error) {
      console.log('TODO->存储图片失败, ', jobData, error);
    }
  }



  // 定义一个函数来生成64字符随机字符串
  async generateRandomFilename() {
    const crypto = require('crypto');
    // 生成一个32字节的随机字符串，因为每个字节转换为两个十六进制字符
    const bytes = crypto.randomBytes(32);
    // 将随机字节转换为十六进制字符串
    const filename = bytes.toString('hex');
    const filenamefull = `${filename}.png`;
    return filenamefull;
  }


  // 定义一个异步函数来���理获取图片尺寸的流程
  async getImageSize(url) {
    try {
      // 使用axios获取图片的数据
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
      });

      // 将获取的数据转成Buffer
      const buffer = Buffer.from(response.data, 'binary');

      // 使用image-size库获取图片尺寸
      const dimensions = imageSize(buffer);

      // 分别赋值给width和height
      const width = dimensions.width;
      const height = dimensions.height;

      return { width, height };
    } catch (error) {
      console.error('Error retrieving image size:', error);
      return null;
    }
  }


  /* 绘制完成后修改数据---中转 */
  async updateDrawData2(jobData, drawRes) {
    try {
      // 图片反向代理
      const url = drawRes.data.imageUrl;
      const fandaiurl = 'mjcdn.aifa.ink';
      const newurl = url.replace('cdn.discordapp.com', fandaiurl);
      console.log('url6846656', url)
      console.log('newurl8975675', newurl)

      const taskid = drawRes.data.id;
      // const { id, content, channel_id, attachments = [], timestamp, durationSpent } = drawRes;
      // const { filename, url, proxy_url, width, height, size } = attachments[0];

      /* 将图片存入cos */
      // 调用函数并将结果赋值给filename变量
      const filename = await this.generateRandomFilename();

      const mjNotSaveImg = await this.globalConfigService.getConfigs(['mjNotSaveImg']);
      let cosUrl = '';

      if (!Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0) {

        try {
          Logger.debug(`------> （中转路径）开始上传图片！！！`, 'MidjourneyService');
          const startDate = new Date();
          cosUrl = await this.uploadService.uploadFileFromUrl({ filename, 'url': newurl });
          const endDate = new Date();
          Logger.debug(`本次图片上传耗时为${(endDate.getTime() - startDate.getTime()) / 1000}秒`, 'MidjourneyService');
        } catch (error) {
          throw new HttpException('存储图片失败23123', error);
        }

      } else {
        console.log('本次不存图片了');
        cosUrl = newurl;
        console.log('cosUrl4354354556', cosUrl)
      }
      /* 记录当前图片存储方式 方便后续对不同平台图片压缩 */
      const cosType = await this.uploadService.getUploadType();
      // 获取图片的宽度和高度
      let width = '300px';
      let height = '400px';
      await this.getImageSize(cosUrl)
        .then(size => {
          if (size) {
            // 处理获取到的尺寸
            width = size.width;
            height = size.height;
          }
        })
        .catch(error => {
          console.error(error);
        });

      /* 整理信息 存入DB */
      const size = 2;
      const drawInfo = {
        status: MidjourneyStatusEnum.DRAWED,
        progress: 100,
        fileInfo: JSON.stringify({ width, height, size, filename, cosUrl, cosType }),
        extend: this.removeEmoji(JSON.stringify(drawRes.data)),
        isSaveImg: !Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0,
        custom_id: taskid
      };
      await this.midjourneyEntity.update({ id: jobData.id }, drawInfo);

    } catch (error) {
      console.log('TODO->存储图片失败, ', jobData, error);
      throw new HttpException('shibai！', HttpStatus.BAD_REQUEST);
    }
  }


  /* 获取到当前ID的历史已经存入的信息并且绘制完成的 防止已经存过的图又被存了 */
  async getHistroyMessageIds(randomDrawId) {
    const res = await this.midjourneyEntity.find({ where: { randomDrawId, status: MidjourneyStatusEnum.DRAWED } });
    return res.map((item: any) => item.message_id);
  }

  /* 发送绘画指令 */
  // midjourney提交绘画
  async sendDrawCommand(drawInfo, jobData) {
    const { fullPrompt, randomDrawId, imgUrl } = drawInfo;
    const prompt = imgUrl ? `${imgUrl} ${fullPrompt}` : `${fullPrompt}`;
    Logger.debug(`本次绘图指令为${prompt}`, 'MidjourneyService');

    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const payloadJson = {
      type: 2,
      application_id,
      guild_id,
      channel_id,
      session_id,
      data: { version, id, name: 'imagine', type: 1, options: [{ type: 3, name: 'prompt', value: prompt }], attachments: [] },
    };
    const payloadJson2 = {
      "prompt": prompt,
      "base64Array": [],
      "notifyHook": "",
      "state": ""
    };

    try {
      const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
      // const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
      const url2 = `${mjProxyUrl}/mj/submit/imagine`;
      const url3 = 'https://discord.com/api/v9/interactions';
      const headers = { authorization };
      const headers2 = {
        'mj-api-secret': authorization,
        'Authorization': authorization
      };


      if (channel_id === '0') {
        // 第三方
        const res = await axios.post(url2, payloadJson2, { 'headers': headers2 });
        if (res.data.result) {
          console.log('res.data23213', res.data);
          return res;
        } else {
          console.log('res.data', res.data);
          throw new HttpException('成功请求但是获取任务id失败res', res.data);
        }
      } else {
        const res = await axios.post(url3, payloadJson, { headers });
        if (res.data.result) {
          return res;
        } else {
          console.log('res.data', res.data);
          throw new HttpException('成功请求但是获取任务id失败res', res.data);
        }
      }

      // const res = await axios.post(url, payloadJson, { headers });
    } catch (error) {
      Logger.error(`发送绘画指令失败`, 'MidjourneyService');
      Logger.error(`发送绘画指令失败详情`, error);
      throw new HttpException('发送绘图指令失败、请联系管理员检测绘画配置！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 发送放大变幻指令 */
  // async sendSmInteractions(params, jobData) {
  //   const { message_id, custom_id } = params;
  //   const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
  //   const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
  //   const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
  //   const headers = { authorization };
  //   const body = {
  //     type: 3,
  //     guild_id,
  //     channel_id,
  //     message_flags: 0,
  //     message_id,
  //     application_id,
  //     session_id,
  //     data: {
  //       component_type: 2,
  //       custom_id,
  //     },
  //   };
  //   try {
  //     await axios.post(url, body, { headers });
  //   } catch (error) {
  //     console.log('发送放大变幻指令失败: ', error);
  //     Logger.error(`发送放大变幻指令失败`, 'MidjourneyService');
  //     throw new HttpException('对图片放大变幻失败...', HttpStatus.BAD_REQUEST);
  //   }
  // }
  /* 发送放大变幻指令--zhongzhuan */
  async sendSmInteractions(params, jobData) {
    const { message_id, custom_id = 0, orderId = 0, extend } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/submit/action` : 'https://discord.com/api/v9/interactions';
    const { action = 1 } = jobData;
    const inf = JSON.parse(extend);
    const buttons = inf.buttons;
    let cusid = null;
    let lab = null;

    if (action === 2 && orderId === 1) {
      lab = "U1";
    } else if (action === 2 && orderId === 2) {
      lab = "U2";
    } else if (action === 2 && orderId === 3) {
      lab = "U3";
    } else if (action === 2 && orderId === 4) {
      lab = "U4";
    } else if (action === 3 && orderId === 1) {
      lab = "V1";
    } else if (action === 3 && orderId === 2) {
      lab = "V2";
    } else if (action === 3 && orderId === 3) {
      lab = "V3";
    } else if (action === 3 && orderId === 4) {
      lab = "V4";
    };

    // 遍历buttons数组，找到label属性等于lib的对象
    let matchedButton = buttons.find(button => button.label === lab);
    // 如果找到了符合条件的对象，就提取其customId属性的值
    cusid = matchedButton ? matchedButton.customId : null;

    const headers = {
      'mj-api-secret': authorization,
      'Authorization': authorization
    };
    const body = {
      "customId": cusid,
      "taskId": custom_id
    };
    try {
      console.log('bfangda2323', body)
      const res = await axios.post(url, body, { headers });
      return res
    } catch (error) {
      console.log('发送放大重新生成变幻指令失败: ', error);
      Logger.error(`发送放大变幻重新生成指令失败`, 'MidjourneyService');
      throw new HttpException('对图片放大变幻重生失败...', HttpStatus.BAD_REQUEST);
    }
  }
  /* 重新生成指令/变化、边角*/
  async sendSmInteractions99(params, jobData) {
    const { message_id, custom_id = 0, orderId = 0, extend } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/submit/action` : 'https://discord.com/api/v9/interactions';
    const { action = 1 } = jobData;
    const inf = JSON.parse(extend);
    const buttons = inf.buttons;
    let act = null;
    let cusid = null;
    let lab = null;
    if (action === 5) {
      lab = "";
    } else if (action === 6) {
      lab = "Zoom Out 1.5x";
    } else if (action === 9) {
      lab = "Zoom Out 2x";
    } else if (action === 7) {
      lab = "Vary (Subtle)";
    } else if (action === 8) {
      lab = "Vary (Strong)";
    };

    // 遍历buttons数组，找到label属性等于lib的对象
    let matchedButton = buttons.find(button => button.label === lab);
    // 如果找到了符合条件的对象，就提取其customId属性的值
    cusid = matchedButton ? matchedButton.customId : null;

    const headers = {
      'mj-api-secret': authorization,
      'Authorization': authorization
    };
    const body = {
      "customId": cusid,
      "taskId": custom_id
    };

    try {
      if (cusid) {
        const res = await axios.post(url, body, { headers });
        return res;
      } else {
        throw new HttpException('没有查询到custom_id的值131', HttpStatus.BAD_REQUEST);
      };

    } catch (error) {
      console.log('发送放大重新生成变幻指令失败: ', error);
      Logger.error(`发送放大变幻重新生成指令失败`, 'MidjourneyService');
      throw new HttpException('对图片放大变幻重生失败...', HttpStatus.BAD_REQUEST);
    }
  };


  /* 重新生成指令/变化、边角*/
  async sendSmInteractionsch(params, jobData) {
    const { custom_id = 0, extend, imgUrl, prompt } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/submit/action` : 'https://discord.com/api/v9/interactions';
    const url2 = mjProxy == 1 ? `${mjProxyUrl}/mj/submit/modal` : 'https://discord.com/api/v9/interactions';
    const { action = 1 } = jobData;
    const inf = JSON.parse(extend);
    const buttons = inf.buttons;
    let cusid = null;
    let lab = null;
    if (action === 15) {
      lab = "Vary (Region)";
    };

    // 遍历buttons数组，找到label属性等于lib的对象
    let matchedButton = buttons.find(button => button.label === lab);
    // 如果找到了符合条件的对象，就提取其customId属性的值
    cusid = matchedButton ? matchedButton.customId : null;

    const headers = {
      'mj-api-secret': authorization,
      'Authorization': authorization
    };
    const body1 = {
      "taskId": custom_id,
      "customId": cusid,
    };
    console.log('body12323', body1);

    try {
      if (cusid) {
        // const res = await axios.post(url, body, { headers });
        const res1 = await axios.post(url, body1, {
          headers: headers,
          maxContentLength: Infinity
        });
        console.log('rres1.data34324', res1.data)

        if (res1.data.result) {
          const body2 = {
            "prompt": prompt,
            "taskId": res1.data.result,
            'maskBase64': imgUrl,
          };
          console.log('body2-2343242', body2);
          const res2 = await axios.post(url2, body2, {
            headers: headers
          });
          console.log('res2.data24', res2.data);
          return res2;
        } else {
          throw new HttpException('没有查询到custom_id的值131', HttpStatus.BAD_REQUEST);
        }

      } else {
        throw new HttpException('没有查询到custom_id的值131', HttpStatus.BAD_REQUEST);
      };

    } catch (error) {
      console.log('发送局部重绘指令失败32423: ', error);
      Logger.error(`发送局部重绘指令失败`, 'MidjourneyService');
      throw new HttpException('对图片局部重绘变幻重生失败...', HttpStatus.BAD_REQUEST);
    }
  };



  /* 扩展图片*/
  async sendSmInteractionskt(params, jobData) {
    const { message_id, custom_id = 0, orderId = 0, extend } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/submit/action` : 'https://discord.com/api/v9/interactions';
    const { action = 1 } = jobData;
    const inf = JSON.parse(extend);
    console.log('extend122123', extend);
    const buttons = inf.buttons;
    let cusid = null;
    let emo = null;
    if (action === 5) {
      emo = "";
    } else if (action === 10) {
      emo = "⬅️";
    } else if (action === 11) {
      emo = "➡️";
    } else if (action === 12) {
      emo = "⬆️";
    } else if (action === 13) {
      emo = "⬇️";
    };

    // 遍历buttons数组，找到label属性等于lib的对象
    let matchedButton = buttons.find(button => button.emoji === emo);
    // 如果找到了符合条件的对象，就提取其customId属性的值
    cusid = matchedButton ? matchedButton.customId : null;

    const headers = {
      'mj-api-secret': authorization,
      'Authorization': authorization
    };
    const body = {
      "customId": cusid,
      "taskId": custom_id
    };

    try {
      if (cusid) {
        const res = await axios.post(url, body, { headers });
        return res;
      } else {
        throw new HttpException('没有查询到custom_id的值131', HttpStatus.BAD_REQUEST);
      };

    } catch (error) {
      console.log('发送阔图指令失败: ', error);
      Logger.error(`发送阔图指令失败`, 'MidjourneyService');
      throw new HttpException('对图片扩展失败...', HttpStatus.BAD_REQUEST);
    }
  };
  /* 发送图片增强指令 */
  async sendVaryInteractions(params, jobData) {
    const { message_id, custom_id } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
    const headers = { authorization };
    const body = {
      type: 3,
      guild_id,
      channel_id,
      message_id,
      application_id,
      session_id,
      data: {
        component_type: 2,
        custom_id,
      },
    };
    try {
      await axios.post(url, body, { headers });
    } catch (error) {
      console.log('发送对单张图片增强指令失败: ', error);
      Logger.error(`发送单张图片增强指令失败`, 'MidjourneyService');
      throw new HttpException('对图片单张增强失败...', HttpStatus.BAD_REQUEST);
    }
  }

  /* 发送单张图片缩放指令 */
  async sendZoomInteractions(params, jobData) {
    const { message_id, custom_id } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
    const headers = { authorization };
    const body = {
      type: 3,
      guild_id,
      channel_id,
      message_id,
      application_id,
      session_id,
      data: {
        component_type: 2,
        custom_id,
      },
    };
    try {
      await axios.post(url, body, { headers });
    } catch (error) {
      console.log('发送对单张图片增强指令失败: ', error);
      Logger.error(`发送单张图片增强指令失败`, 'MidjourneyService');
      throw new HttpException('对图片单张增强失败...', HttpStatus.BAD_REQUEST);
    }
  }

  /* 轮询比对绘画结果-官方 */
  async pollComparisonResultDraw(drawInfo) {
    Logger.debug(`开始查询绘画结果`, 'MidjourneyService');
    const startTime = Date.now();
    const INTERVAL_BEFORE_90S = 10000; // 0s-90s之间每十秒查一次
    const INTERVAL_AFTER_90S = 20000; // 90s之后每30秒查一次
    const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 100秒
    const TIMEOUT = timeout;
    let pollingCount = 0; // 记录轮询次数
    let drawRes = null;
    let isMatchSuccessful = false;
    const { id, mjProxy } = await this.getMjDefaultParams();
    try {
      while (!isMatchSuccessful && Date.now() - startTime < TIMEOUT) {
        let interval;
        if (Date.now() - startTime < 90000) {
          interval = INTERVAL_BEFORE_90S;
        } else {
          interval = INTERVAL_AFTER_90S;
        }
        await this.sleep(interval);
        Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次开始查询`, 'MidjourneyService');
        console.log('drawInfo', drawInfo);
        drawRes = await this.findCurrentPromptResult(drawInfo.randomDrawId);
        if (drawRes) {
          const { content } = drawRes;
          const progress = await this.parseProgress(content);
          Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次、 当前绘画进度为${progress}%`, 'MidjourneyService');
          /* TODO 实时去改变db记录当前解结果  更多信息是否存储 待考虑 */
          await this.midjourneyEntity.update({ id: drawInfo.id }, { progress: progress ?? 100 });
        }
        /* 比对是否绘制完成 */
        isMatchSuccessful = drawRes && !drawRes.edited_timestamp;
        pollingCount++;
      }
      if (!drawRes) {
        await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
        throw new HttpException('绘画超时，请稍后再试！', HttpStatus.BAD_REQUEST);
      }

      const endTime = Date.now();
      return { ...drawRes, durationSpent: Math.floor((endTime - startTime) / 1000) };
    } catch (error) {
      console.log('获取图片列表结果失败: ', error);
      throw new HttpException('获取图片列表结果失败', HttpStatus.BAD_REQUEST);
    }
  }

  /* 轮询比对绘画结果-中转 */
  async pollComparisonResultDraw2(drawInfo, res) {
    Logger.debug(`开始查询绘画结果`, 'MidjourneyService');
    const startTime = Date.now();
    const INTERVAL_BEFORE_90S = 10000; // 0s-90s之间每十秒查一次
    const INTERVAL_AFTER_90S = 20000; // 90s之后每30秒查一次
    const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 100秒
    const TIMEOUT = timeout;
    let pollingCount = 0; // 记录轮询次数
    let drawRes = null;
    let isMatchSuccessful = false;

    try {
      while (!isMatchSuccessful && Date.now() - startTime < TIMEOUT) {
        let interval;
        if (Date.now() - startTime < 90000) {
          interval = INTERVAL_BEFORE_90S;
        } else {
          interval = INTERVAL_AFTER_90S;
        }
        await this.sleep(interval);
        Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次开始查询`, 'MidjourneyService');
        console.log('res', res);

        if (res.result === null) {
          throw new HttpException('获取任务id失败！', HttpStatus.BAD_REQUEST);
        };

        drawRes = await this.findCurrentPromptResult2(res.result);

        console.log('drawRes.data529', drawRes.data);
        const progress = drawRes.data.progress;
        const msg = drawRes.data?.message ?? '默认消息';

        if (drawRes) {
          Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次、 当前绘画进度为${progress}`, 'MidjourneyService');
          /* TODO 实时去改变db记录当前解结果  更多信息是否存储 待考虑 */
          if (progress && progress.length < 7) {
            const progressNumber = parseInt(progress.replace('%', ''), 10);
            await this.midjourneyEntity.update({ id: drawInfo.id }, { progress: progressNumber });
          }
        };
        if (msg === "没有相关任务") {
          throw new HttpException('没有相关任务！', HttpStatus.BAD_REQUEST);
        };
        if (res.error) {
          throw new HttpException('未知错误0990！', HttpStatus.BAD_REQUEST);
        };
        if (progress !== "100%") {

          isMatchSuccessful = false;
          pollingCount++;

        } else {
          return drawRes;
        };


      }
      if (Date.now() - startTime > TIMEOUT) {
        await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
        throw new HttpException('绘画超时，请稍后再试！', HttpStatus.BAD_REQUEST);
      }

      const endTime = Date.now();
      return { ...drawRes, durationSpent: Math.floor((endTime - startTime) / 1000) };
    } catch (error) {
      console.log('获取图片列表结果失败: ', error);
      throw new HttpException('获取图片列表结果失败', HttpStatus.BAD_REQUEST);
    }
  }

  /* 轮询比对拿到放大图片 */
  async pollComparisonResultUpscale(drawInfo) {
    Logger.debug(`开始查询放大图片信息`, 'MidjourneyService');
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let enlargeImgDetail = null;
    let pollingCount = 0;
    while (!enlargeImgDetail && pollingCount < 10) {
      Logger.debug(`开始比对放大图片第${pollingCount + 1}次`, 'MidjourneyService');
      enlargeImgDetail = await this.findCurrentEnlargeImgResult(randomDrawId, orderId);
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000));
      pollingCount++;
    }

    if (!enlargeImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('放大图片超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...enlargeImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 轮询比对拿到重新绘制的那张图 */
  async pollComparisonResultReGenerate(drawInfo) {
    Logger.debug(`开始查询重复绘制的图片信息`, 'MidjourneyService');
    const TIMEOUT = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let reGenerateImgDetail = null;
    let pollingTime = 0;
    let count = 0;
    while (!reGenerateImgDetail && pollingTime < TIMEOUT) {
      Logger.debug(`开始比对重新绘制图片第${count + 1}次`, 'MidjourneyService');
      reGenerateImgDetail = await this.findCurrentReGenerateImgResult(randomDrawId, message_id);
      const t = Math.floor(Math.random() * (5000 - 3000 + 1)) + 8000;
      await new Promise((resolve) => setTimeout(resolve, t));
      pollingTime += t;
      count++;
    }

    if (!reGenerateImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('重新绘制图片超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...reGenerateImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 对单张图片增强 */
  async pollComparisonResultVary(drawInfo) {
    Logger.debug(`开始查询单张图片增强的图片信息`, 'MidjourneyService');
    const TIMEOUT = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let varyImgDetail = null;
    let pollingTime = 0;
    let count = 0;
    while (!varyImgDetail && pollingTime < TIMEOUT) {
      Logger.debug(`开始单张图片增强第${count + 1}次`, 'MidjourneyService');
      varyImgDetail = await this.findCurrentVaryImgResult(randomDrawId, message_id);
      const t = Math.floor(Math.random() * (5000 - 3000 + 1)) + 8000;
      await new Promise((resolve) => setTimeout(resolve, t));
      pollingTime += t;
      count++;
    }

    if (!varyImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('单张图片增强超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...varyImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 对单张图片缩放 */
  async pollComparisonResultZoom(drawInfo) {
    Logger.debug(`开始查询单张图片缩放的图片信息`, 'MidjourneyService');
    const TIMEOUT = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let zoomImgDetail = null;
    let pollingTime = 0;
    let count = 0;
    while (!zoomImgDetail && pollingTime < TIMEOUT) {
      Logger.debug(`开始单张图片缩放第${count + 1}次`, 'MidjourneyService');
      zoomImgDetail = await this.findCurrentZoomImgResult(randomDrawId, message_id);
      const t = Math.floor(Math.random() * (5000 - 3000 + 1)) + 8000;
      await new Promise((resolve) => setTimeout(resolve, t));
      pollingTime += t;
      count++;
    }

    if (!zoomImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('单张图片缩放超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...zoomImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 轮询比对拿到变体图片 */
  async pollComparisonResultVariation(drawInfo) {
    Logger.debug(`开始轮询单张变换图片结果`, 'MidjourneyService');
    let variationImgDetail = null;
    const startTime = Date.now();
    while (!variationImgDetail) {
      Logger.debug(`变换图片获取中------>`, 'MidjourneyService');
      variationImgDetail = await this.findCurrentVariationImgResult(drawInfo.randomDrawId);
      const nextPollingDelay = 10000; // 每10秒轮询一次
      await this.sleep(nextPollingDelay);

      const endTime = Date.now();
      const durationSpent = Math.floor(endTime - startTime);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
      const TIMEOUT = timeout;

      if (durationSpent >= TIMEOUT) {
        await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
        throw new HttpException('变换当前图片超时！', HttpStatus.BAD_REQUEST);
      }
    }
    return { ...variationImgDetail, durationSpent: Math.floor(Date.now() - startTime) };
  }

  /* 比对找到放大图片的地址作为返回结果 */
  async findCurrentEnlargeImgResult(randomDrawId, orderId) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const enlargeImgDetail = messageList.find((item) => {
      const { content } = item;
      if (!this.extractContent(content)) return false;
      const { prompt, order } = this.extractContent(content);
      return content.includes(randomDrawId) && orderId === order && !histroyMessageIds.includes(item.id);
    });
    return enlargeImgDetail;
  }

  /* 比对拿到变体图片 */
  async findCurrentVariationImgResult(randomDrawId) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const variationImgDetail = messageList.find((item) => {
      const { content } = item;
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && this.isVariationsImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (variationImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【变体图片】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return variationImgDetail;
  }

  /* 匹配拿到重新生成的图片, 重新生成的图  message_id 变了 所以对比需要排除message_id */
  async findCurrentReGenerateImgResult(randomDrawId, message_id) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const reGenerateImgDetail = messageList.find((item) => {
      const { content } = item;
      // message_reference 重新绘制的多一个字段 这个就是原始图片的message_id
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && item.id !== message_id && this.isReGenerateImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (reGenerateImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【重新生成图片】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return reGenerateImgDetail;
  }

  /* 匹配缩放图 */
  async findCurrentZoomImgResult(randomDrawId, message_id) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const reGenerateImgDetail = messageList.find((item) => {
      const { content } = item;
      // message_reference 重新绘制的多一个字段 这个就是原始图片的message_id
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && item.id !== message_id && this.isZoomImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (reGenerateImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【重新生成图片】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return reGenerateImgDetail;
  }

  /* 匹配拿图 单张生成图 */
  async findCurrentVaryImgResult(randomDrawId, message_id) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const varyImgDetail = messageList.find((item) => {
      const { content } = item;
      // message_reference 重新绘制的多一个字段 这个就是原始图片的message_id
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && item.id !== message_id && this.isVaryImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (varyImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【单张图片增强】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return varyImgDetail;
  }

  /* 匹配放大的单张图片的操作 */
  extractContent(str: string): { prompt: string; order: number } | null {
    const promptMatch = str.match(/\*\*(.+?)\*\*/);
    const orderMatch = str.match(/- Image #(\d+)/);
    if (!promptMatch || !orderMatch) {
      return null;
    }
    const prompt = promptMatch[1];
    const order = parseInt(orderMatch[1]);
    return { prompt, order };
  }

  /* 比对当前列表中是否存在我们正在绘制的图片 histroyMessageIds是历史相同prompt生成的  有的话排除这些 */
  async findCurrentPromptResult(randomDrawId) {
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const messageList = await this.getMessageList();

    console.log('messageList', messageList);

    if (!messageList || !messageList.length) return;
    const matchingItem = messageList.find((item) => {
      const { attachments = [], content, edited_timestamp } = item;
      // 如果这个参数有值 edited_timestamp 就说明在绘画中 返回结果但是不算结束 其他比对逻辑： content绘画词包含我们的randomDrawId 并且attachments是有值的 其实包含的这个图是我们之前没存入db的
      return content.includes(randomDrawId) && attachments.length > 0 && !histroyMessageIds.includes(item?.id);
    });
    return matchingItem || null;
  }


  // 第三方中转，通过任务id获取图片
  async findCurrentPromptResult2(taskid) {
    const { authorization } = await this.getMjDefaultParams();

    const tid = taskid;

    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';

    const fullurl = `${mjProxyUrl}/mj/task/${tid}/fetch`;
    const headers = {
      'mj-api-secret': authorization,
      "Authorization": authorization
    };
    console.log('fullurl2423412', fullurl);
    console.log('headers324234', headers)

    try {
      const drawrews = await axios.get(fullurl, { headers });
      console.log('获取任务成功 ');
      return drawrews;
    } catch (error) {
      console.log('获取任务失败: ', error);
    }
  }




  /* 判断是否是变体图片 */
  isVariationsImage(str) {
    const regex = /- Variations/;
    return regex.test(str);
  }

  /* 判读是否是单张图片从而 */
  isSingleImage(str) {
    const regex = /Image #\d+/;
    return regex.test(str);
  }

  /* 判断是否不是变体或者放大、防止拿图的时候 重新生成匹配到了变体或者 放大 */
  isReGenerateImage(str) {
    return !this.isVariationsImage(str) && !this.isSingleImage(str);
  }

  /* 判断是不是增强的图 */
  isVaryImage(str) {
    const regex = /- Variations \(.*?\)/;
    return regex.test(str);
  }

  /* 判断是不是缩放图 */
  isZoomImage(str) {
    const regex = /- Zoom Out/;
    return regex.test(str);
  }

  /* 获取Mj参数 */
  async getMjDefaultParams() {
    const configs = await this.globalConfigService.getConfigs([
      'mjId',
      'mjApplicationId',
      'mjGuildId',
      'mjChannelId',
      'mjSessionId',
      'mjVersion',
      'mjAuthorization',
      'mjRateLimit',
      'mjProxy',
    ]);
    const params = {
      application_id: configs.mjApplicationId,
      guild_id: configs.mjGuildId,
      channel_id: configs.mjChannelId,
      session_id: configs.mjSessionId,
      version: configs.mjVersion,
      id: configs.mjId,
      authorization: configs.mjAuthorization,
      mjRateLimit: configs.mjRateLimit,
      mjProxy: configs.mjProxy || 0,
    };
    return params;
  }

  /* 查询绘画的所有列表 */
  async getMessageList() {
    try {
      const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
      const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
      const url =
        mjProxy == 1 ? `${mjProxyUrl}/mj/list?channel_id=${channel_id}` : `https://discord.com/api/v9/channels/${channel_id}/messages?limit=50`;
      const headers = { authorization };
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      Logger.error('查询绘制结果失败: getMessageList', error, 'MidjourneyService');
      return [];
    }
  }

  /* 通过content拿到百分比进度 */
  parseProgress(content) {
    const regex = /\((\d+)%\)/;
    const match = content.match(regex);

    if (match) {
      return parseInt(match[1], 10);
    } else {
      return null;
    }
  }

  /* 去除字符串表情 防止低版本数据库存入失败 */
  removeEmoji(str) {
    const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    return str.replace(regex, '');
  }

  /* 绑定jobId到绘画记录 */
  async bindJobId(id, jobId) {
    await this.midjourneyEntity.update({ id }, { jobId });
  }

  /* 获取我的绘制列表 */
  // 提交查询
  async getDrawList(req: Request, params) {
    try {
      const { page = 1, size = 30 } = params;
      const [rows, count] = await this.midjourneyEntity.findAndCount({
        where: { userId: req.user.id, isDelete: 0 },
        order: { id: 'DESC' },
        take: size,
        skip: (page - 1) * size,
      });
      const mjProxyImgUrl = await this.globalConfigService.getConfigs(['mjProxyImgUrl']);
      rows.forEach((item: any) => {
        try {
          const { extend, isSaveImg, fileInfo } = item;
          const extendObj = JSON.parse(extend);
          const attachments = extendObj?.attachments;
          const components = extendObj?.components;
          const but32 = extendObj?.data?.buttons?.[0]?.label ?? null;
          const but35 = extendObj?.buttons?.[0]?.label ?? null;

          // 确保 attachments 是数组且至少有一个元素
          const originUrl = Array.isArray(attachments) && attachments.length > 0 ? attachments[0].url : null;

          // 格式化 fileInfo
          item.fileInfo = this.formatFileInfo(fileInfo, isSaveImg, mjProxyImgUrl, originUrl);
          // 确保 components 是数组且至少有两层嵌套的元素存在
          const isGroup = Array.isArray(components) &&
            components.length > 0 &&
            Array.isArray(components[0].components) &&
            components[0].components.length > 0 &&
            components[0].components[0].label === 'U1';

          item.isGroup = isGroup;
          if (but32 === 'U1') {
            item.isGroup = true;
          };
          if (but35 === 'U1') {
            item.isGroup = true;
          };
          item.originUrl = originUrl;
        } catch (error) {
          console.log('error646', error);
        }
      });
      const countQueue = await this.midjourneyEntity.count({ where: { isDelete: 0, status: In([1, 2]) } });
      const data: any = { rows: formatCreateOrUpdateDate(rows), count, countQueue };
      return data;
    } catch (error) {
      throw new HttpException('获取我得绘制列表失败', HttpStatus.BAD_REQUEST);
    };

  }

  /* 格式化fileinfo  对于不同平台的图片进行压缩 */
  formatFileInfo(fileInfo, isSaveImg, mjProxyImgUrl, originUrl) {
    if (!fileInfo) return {};
    let parseFileInfo: any = null;
    try {
      parseFileInfo = JSON.parse(fileInfo);
    } catch (error) {
      parseFileInfo = null;
    }
    if (!parseFileInfo) return;
    const { url, filename, size, cosUrl, width, height } = parseFileInfo;
    const targetSize = 310; // 目标宽度或高度

    // TODO判断逻辑有误 腾讯云会导致也判断为 chevereto  更换判断规则
    const imgType = cosUrl.includes('cos') ? 'tencent' : cosUrl.includes('oss') ? 'ali' : 'chevereto';
    let compress;
    let thumbImg;
    if (imgType === 'tencent') {
      const ratio = width / height;
      const targetHeight = Math.round(targetSize / ratio); // 计算目标高度
      thumbImg = cosUrl + `?imageView2/1/w/${targetSize}/h/${targetHeight}/q/55`;
    }
    if (imgType === 'ali') {
      const ratio = height / width;
      const targetWidth = Math.round(targetSize / ratio); // 计算目标宽度
      thumbImg = cosUrl + `?x-oss-process=image/resize,w_${targetWidth}`;
    }
    if (imgType === 'chevereto') {
      thumbImg = cosUrl.replace(/\.png$/, '.md.png');
    }
    parseFileInfo.thumbImg = thumbImg;
    /* 如果配置了不存储图片 则 isSaceImg 为false的则需要使用反代地址拼接 */
    // if (!isSaveImg) {
    //   const proxyImgUrl = `${mjProxyImgUrl}/mj/pipe?url=${originUrl}`;
    //   parseFileInfo.thumbImg = proxyImgUrl;
    //   parseFileInfo.cosUrl = proxyImgUrl;
    // };
    return parseFileInfo;
  }
  /* 变体或者放大的时候去获取需要的信息---中转通道 */
  async getDrawActionDetail2(drawId) {
    const detailInfo = await this.midjourneyEntity.findOne({ where: { id: drawId } });
    if (!detailInfo) throw new HttpException('当前绘画信息不存在！', HttpStatus.BAD_REQUEST);
    const { custom_id, message_id, prompt, imgUrl, extraParam, randomDrawId, extend } = detailInfo;
    return { custom_id, message_id, prompt, imgUrl, extraParam, randomDrawId, extend };
  }

  /* 局部重绘需要的信息---中转通道 */
  async getDrawActionDetailch(drawId) {
    const detailInfo = await this.midjourneyEntity.findOne({ where: { id: drawId } });
    if (!detailInfo) throw new HttpException('当前绘画信息不存在！', HttpStatus.BAD_REQUEST);
    const { custom_id, message_id, imgUrl, extraParam, randomDrawId, extend } = detailInfo;
    return { custom_id, message_id, imgUrl, extraParam, randomDrawId, extend };
  }
  /* 变体或者放大的时候去获取需要的信息---官方通道 */
  async getDrawActionDetail(action, drawId, orderId) {
    const detailInfo = await this.midjourneyEntity.findOne({ where: { id: drawId } });
    if (!detailInfo) throw new HttpException('当前绘画信息不存在！', HttpStatus.BAD_REQUEST);
    const { extend, message_id, prompt, imgUrl, extraParam, randomDrawId } = detailInfo;
    const historyDetailDrawInfo = JSON.parse(extend);
    const { components = [] } = historyDetailDrawInfo;
    if (!components.length) {
      throw new HttpException('当前图片没有绘画信息、无法放大!', HttpStatus.BAD_REQUEST);
    }
    /* 对于四张图组图这种 components数组 第一项 有五个数据 分别对应1-4的图片所需参数和重新绘制参数 5对应重新绘制  第二项则是对应变换的四张图  */
    let currentImgComponent: any = {};
    if (action === MidjourneyActionEnum.UPSCALE) {
      currentImgComponent = components[0]['components'][orderId - 1];
    }
    if (action === MidjourneyActionEnum.VARIATION) {
      currentImgComponent = components[1]['components'][orderId - 1];
    }
    if (action === MidjourneyActionEnum.REGENERATE) {
      currentImgComponent = components[0]['components'][orderId - 1];
    }
    /* 对于单张图来说 components数组 第一项 有两个 分别对应 Vary (Strong) Vary (Subtle) 第二项则是 Zoom Out 2x | Zoom Out 1.5x | custom */
    if (action === 7 || action === 8) {
      currentImgComponent = components[0]['components'][orderId - 1];
    }
    if (action === 6 || action === 9) {
      currentImgComponent = components[1]['components'][orderId - 1];
    }
    const { custom_id } = currentImgComponent;
    return { custom_id, message_id, prompt, imgUrl, extraParam, randomDrawId, action };
  }

  /* 检测当前图片是否已经放大过了--官方+中转 */
  async checkIsUpscale(custom_id) {
    // 查看count是不是大于0就行
    const count = await this.midjourneyEntity.count({ where: { custom_id, action: 2, status: MidjourneyStatusEnum.DRAWED } });
    if (count > 0) {
      throw new HttpException('当前图片已经放大过了！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 删除图片 */
  async deleteDraw(id: number, req: Request) {
    const d = await this.midjourneyEntity.findOne({ where: { id, userId: req.user.id, isDelete: 0 } });
    if (!d) {
      throw new HttpException('当前图片不存在！', HttpStatus.BAD_REQUEST);
    }
    if (d.status === 2) {
      throw new HttpException('绘制中的图片任务、禁止删除！', HttpStatus.BAD_REQUEST);
    }
    const res = await this.midjourneyEntity.update({ id }, { isDelete: 1 });
    if (res.affected > 0) {
      return '删除成功！';
    } else {
      throw new HttpException('删除失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 限制同时最多两个任务进行中 */
  async checkLimit(req: Request) {
    const { role, id } = req.user;
    // if (['super', 'admin'].includes(role)) {
    //   return;
    // }
    const count = await this.midjourneyEntity.count({ where: { userId: id, isDelete: 0, status: In([1, 2]) } });
    const mjLimitCount = await this.globalConfigService.getConfigs(['mjLimitCount']);
    const max = mjLimitCount ? Number(mjLimitCount) : 2;
    if (count >= max) {
      throw new HttpException(`当前管理员限制单用户同时最多能执行${max}个任务`, HttpStatus.BAD_REQUEST);
    }
  }

  /* 队列回调绘图失败时候 */
  async drawFailed(jobData) {
    const { id, userId, action } = jobData;

    console.log('userId324324', userId);
    /* 退还余额 放大图片（类型2）是1  其他都是4 */
    const amount = action === 2 ? 1 : 4;
    await this.userBalanceService.refundMjBalance(userId, amount);
    await this.midjourneyEntity.update({ id }, { status: 4 });
  }

  /* 获取绘画列表  */
  async getList(params: GetListDto) {
    const { page = 1, size = 20, rec, userId, status } = params;

    /* 客户端查询走缓存 */
    if (Number(size) === 999) {
      const cache = await this.redisCacheService.get({ key: 'midjourney:getList' });
      if (cache) {
        try {
          return JSON.parse(cache);
        } catch (error) {
          return [];
        }
      }
    }

    const where = { isDelete: 0 };
    rec && Object.assign(where, { rec });
    userId && Object.assign(where, { userId });
    status && Object.assign(where, { status });
    const [rows, count] = await this.midjourneyEntity.findAndCount({
      where,
      order: { id: 'DESC' },
      take: size,
      skip: (page - 1) * size,
      select: ['fileInfo', 'extend', 'prompt', 'createdAt', 'id', 'extend', 'fullPrompt', 'rec', 'isSaveImg', 'gk'],
    });
    const mjProxyImgUrl = await this.globalConfigService.getConfigs(['mjProxyImgUrl']);
    rows.forEach((item: any) => {
      try {
        const { extend, isSaveImg, fileInfo } = item;
        const originUrl = JSON.parse(fileInfo)?.cosUrl;
        // const originUrl = JSON.parse(extend)?.attachments[0]?.url;
        item.fileInfo = this.formatFileInfo(fileInfo, isSaveImg, mjProxyImgUrl, originUrl);
        try {
          const parsedExtend = JSON.parse(extend); // 尝试解析 extend 字符串
          item.isGroup = parsedExtend?.buttons?.[0]?.label === 'U1';
        } catch (error) {
          // 如果解析 JSON 失败或访问属性时发生其他错误，可以在这里处理
          console.error('解析 extend 失败或访问属性出错:', error);
          item.isGroup = false;
        }
        // item.isGroup = JSON.parse(extend)?.buttons[0]?.label === 'U1';
        item.originUrl = originUrl;
      } catch (error) { console.log('error213213', error) }
    });

    if (Number(size) === 999) {
      const data = {
        rows: rows.map((item: any) => {
          const { fileInfo, prompt, createdAt, id, fullPrompt, rec, originUrl } = item;
          return { fileInfo, prompt, createdAt, id, fullPrompt, rec, originUrl };
        }),
        count,
      };
      await this.redisCacheService.set({ key: 'midjourney:getList', val: JSON.stringify(data) }, 60 * 5);
      return data;
    }
    const data = { rows, count };
    // console.log('data3434', data);
    return data;
  }

  /*  */
  async getFullPrompt(id: number) {
    const m = await this.midjourneyEntity.findOne({ where: { id } });
    if (!m) return '';
    const { fullPrompt } = m;
    return fullPrompt;
  }

  /* 管理端获取绘画列表 */
  async getAdminDrawList(req: Request, params: GetListDto) {
    try {
      const { page = 1, size = 10, rec, userId, status } = params;
      const where = { isDelete: 0 };
      rec && Object.assign(where, { rec });
      userId && Object.assign(where, { userId });
      status && Object.assign(where, { status });
      const [rows, count] = await this.midjourneyEntity.findAndCount({
        where,
        order: { id: 'DESC' },
        take: size,
        skip: (page - 1) * size,
      });

      const userIds = rows.map((item: any) => item.userId).filter((id) => id < 100000);
      const userInfos = await this.userEntity.find({ where: { id: In(userIds) }, select: ['id', 'username', 'avatar', 'email'] });
      rows.forEach((item: any) => {
        item.userInfo = userInfos.find((user) => user.id === item.userId);
      });
      const mjProxyImgUrl = await this.globalConfigService.getConfigs(['mjProxyImgUrl']);
      rows.forEach((item: any) => {
        try {
          const { extend, isSaveImg, fileInfo } = item;
          const originUrl = JSON.parse(extend)?.attachments[0]?.url;
          item.fileInfo = this.formatFileInfo(fileInfo, isSaveImg, mjProxyImgUrl, originUrl);
          console.log('item.fileInfo574534', item.fileInfo)
          // item.isGroup = JSON.parse(extend)?.components[0]?.components.length === 5;
          item.isGroup = JSON.parse(extend)?.components[0]?.components[0].label === 'U1';
          item.originUrl = originUrl;
        } catch (error) { }
      });
      if (req.user.role !== 'super') {
        rows.forEach((item: any) => {
          if (item.userInfo && item.userInfo.email) {
            item.userInfo.email = item.userInfo.email.replace(/(.{2}).+(.{2}@.+)/, '$1****$2');
          }
        });
      }
      return { rows, count };
    } catch (error) {
      throw new HttpException('查询失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 推荐与取消推荐图片 */
  async recDraw(params) {
    const { id } = params;
    const draw = await this.midjourneyEntity.findOne({ where: { id, status: 3, isDelete: 0 } });
    if (!draw) {
      throw new HttpException('当前图片不存在！', HttpStatus.BAD_REQUEST);
    }
    const { rec } = draw;
    const res = await this.midjourneyEntity.update({ id }, { rec: rec === 1 ? 0 : 1 });
    if (res.affected > 0) {
      return '操作成功！';
    }
  }

  /* 清空数据库的队列 */
  async cleanQueue() {
    try {
      await this.midjourneyEntity.update({ status: 2 }, { status: 4 });
    } catch (error) {
      console.log('TODO->error: ', error);
    }
  }

  /* 删除记录 */
  async delLog(req: Request, body) {
    const { id } = body;
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    const res = await this.midjourneyEntity.delete({ id });
    if (res.affected > 0) {
      return '删除记录成功！';
    } else {
      throw new HttpException('删除记录失败！', HttpStatus.BAD_REQUEST);
    }
  }

  async setPrompt(req: Request, body) {
    try {
      const { prompt, status, isCarryParams, title, order, id, aspect } = body;
      if (id) {
        return await this.mjPromptsEntity.update({ id }, { prompt, status, isCarryParams, order, aspect });
      } else {
        return await this.mjPromptsEntity.save({ prompt, status, isCarryParams, title, order, aspect });
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async delPrompt(req: Request, body) {
    const { id } = body;
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    return await this.mjPromptsEntity.delete({ id });
  }

  async queryPrompt() {
    return await this.mjPromptsEntity.find({
      order: { order: 'DESC' },
    });
  }

  async proxyImg(params) {
    const { url } = params;
    if (!url) return;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    return base64;
  }
}
