'use strict';function _0x3276(){const _0x4cee88=['../../common/constants/balance.constant','month','andWhere','UserEntity','Sign\x20in\x20successful.','RechargeType','signin.signInTime\x20>=\x20:firstDay','今日已签到、改天再来吧!.','SigninEntity','2905395ZjTYvG','YYYY-MM-DD\x20HH:mm:ss','__metadata','HttpStatus','BAD_REQUEST','GlobalConfigService','HttpException','sign','7209416wPNKJd','getSigninLog','userEntity','design:paramtypes','addBalanceToUser','./../globalConfig/globalConfig.service','debug','SIGN_IN','findOne','object','YYYY-MM-DD','length','__decorate','7ctdzGG','Repository','Logger','InjectRepository','./signIn.entity','error:\x20','getOwnPropertyDescriptor','../user/user.entity','format','startOf','../../common/utils/date','signin.signInTime\x20<=\x20:lastDay','signInDate','SigninService','day','signin','昨天签到了、今天是连续签到！','push','userBalanceService','log','isSigned','1053264JiqhXQ','getDate','metadata','endOf','858600dTjgyS','setDate','getSignatureGiftConfig','default','598586zIrhDy','save','globalConfigService','update','signinEntity','decorate','defineProperty','typeorm','function','createQueryBuilder','user','1496290RjDJCa','signin.signInDate\x20as\x20signInDate,\x20signin.isSigned\x20as\x20isSigned','2856712DiNlmk','Injectable','saveRecordRechargeLog','用户不存在','subtract','./../userBalance/userBalance.service','UserBalanceService'];_0x3276=function(){return _0x4cee88;};return _0x3276();}const _0x511141=_0x5b9c;(function(_0x126559,_0x5146e1){const _0x2c0b10=_0x5b9c,_0x2f11a3=_0x126559();while(!![]){try{const _0xdf6128=parseInt(_0x2c0b10(0x1c4))/0x1+-parseInt(_0x2c0b10(0x1cf))/0x2+-parseInt(_0x2c0b10(0x1c0))/0x3+parseInt(_0x2c0b10(0x1d1))/0x4+-parseInt(_0x2c0b10(0x1e1))/0x5+-parseInt(_0x2c0b10(0x1bc))/0x6+parseInt(_0x2c0b10(0x1f6))/0x7*(parseInt(_0x2c0b10(0x1e9))/0x8);if(_0xdf6128===_0x5146e1)break;else _0x2f11a3['push'](_0x2f11a3['shift']());}catch(_0x340a28){_0x2f11a3['push'](_0x2f11a3['shift']());}}}(_0x3276,0x6743d));function _0x5b9c(_0x1d158d,_0x24b53d){const _0x32769a=_0x3276();return _0x5b9c=function(_0x5b9cbd,_0x257716){_0x5b9cbd=_0x5b9cbd-0x1b9;let _0x54f7f5=_0x32769a[_0x5b9cbd];return _0x54f7f5;},_0x5b9c(_0x1d158d,_0x24b53d);}var __decorate=this&&this[_0x511141(0x1f5)]||function(_0x10e7d5,_0x215c29,_0x1fee2d,_0x48d120){const _0x26d804=_0x511141;var _0x129f17=arguments[_0x26d804(0x1f4)],_0x4f04c3=_0x129f17<0x3?_0x215c29:_0x48d120===null?_0x48d120=Object[_0x26d804(0x1fc)](_0x215c29,_0x1fee2d):_0x48d120,_0x1f3e73;if(typeof Reflect==='object'&&typeof Reflect[_0x26d804(0x1c9)]===_0x26d804(0x1cc))_0x4f04c3=Reflect[_0x26d804(0x1c9)](_0x10e7d5,_0x215c29,_0x1fee2d,_0x48d120);else{for(var _0x2d46b7=_0x10e7d5[_0x26d804(0x1f4)]-0x1;_0x2d46b7>=0x0;_0x2d46b7--)if(_0x1f3e73=_0x10e7d5[_0x2d46b7])_0x4f04c3=(_0x129f17<0x3?_0x1f3e73(_0x4f04c3):_0x129f17>0x3?_0x1f3e73(_0x215c29,_0x1fee2d,_0x4f04c3):_0x1f3e73(_0x215c29,_0x1fee2d))||_0x4f04c3;}return _0x129f17>0x3&&_0x4f04c3&&Object[_0x26d804(0x1ca)](_0x215c29,_0x1fee2d,_0x4f04c3),_0x4f04c3;},__metadata=this&&this[_0x511141(0x1e3)]||function(_0x2b90ef,_0x5d53c8){const _0xe6245a=_0x511141;if(typeof Reflect===_0xe6245a(0x1f2)&&typeof Reflect[_0xe6245a(0x1be)]==='function')return Reflect[_0xe6245a(0x1be)](_0x2b90ef,_0x5d53c8);},__param=this&&this['__param']||function(_0x2d5bb,_0xa41478){return function(_0x41fbc2,_0x140a40){_0xa41478(_0x41fbc2,_0x140a40,_0x2d5bb);};};Object[_0x511141(0x1ca)](exports,'__esModule',{'value':!![]}),exports[_0x511141(0x203)]=void 0x0;const globalConfig_service_1=require(_0x511141(0x1ee)),userBalance_service_1=require(_0x511141(0x1d6)),common_1=require('@nestjs/common'),signIn_entity_1=require(_0x511141(0x1fa)),typeorm_1=require('@nestjs/typeorm'),typeorm_2=require(_0x511141(0x1cb)),date_1=require(_0x511141(0x200)),user_entity_1=require(_0x511141(0x1fd)),balance_constant_1=require(_0x511141(0x1d8));let SigninService=class SigninService{constructor(_0x272e1a,_0x4b9306,_0x25983b,_0x5a7874){const _0x3cc1fb=_0x511141;this[_0x3cc1fb(0x1c8)]=_0x272e1a,this[_0x3cc1fb(0x1eb)]=_0x4b9306,this['userBalanceService']=_0x25983b,this[_0x3cc1fb(0x1c6)]=_0x5a7874;}async[_0x511141(0x1e8)](_0x220094){const _0x41f654=_0x511141,{id:_0x2891d8}=_0x220094[_0x41f654(0x1ce)],_0x755081=(0x0,date_1[_0x41f654(0x1c3)])(new Date())[_0x41f654(0x1fe)](_0x41f654(0x1f3)),_0x16ed95=await this[_0x41f654(0x1c8)]['findOne']({'where':{'userId':_0x2891d8,'signInDate':_0x755081}});if(_0x16ed95)throw new common_1[(_0x41f654(0x1e7))](_0x41f654(0x1df),common_1[_0x41f654(0x1e4)][_0x41f654(0x1e5)]);const {model3Count:_0x3c6420,model4Count:_0x3ffc27,drawMjCount:_0x58ab0a}=await this[_0x41f654(0x1c6)][_0x41f654(0x1c2)]();await this[_0x41f654(0x1c8)][_0x41f654(0x1c5)]({'userId':_0x2891d8,'signInTime':new Date(),'signInDate':_0x755081,'isSigned':!![]}),await this[_0x41f654(0x1b9)][_0x41f654(0x1ed)](_0x2891d8,{'model3Count':_0x3c6420,'model4Count':_0x3ffc27,'drawMjCount':_0x58ab0a}),await this[_0x41f654(0x1b9)][_0x41f654(0x1d3)]({'userId':_0x2891d8,'rechargeType':balance_constant_1[_0x41f654(0x1dd)][_0x41f654(0x1f0)],'model3Count':_0x3c6420,'model4Count':_0x3ffc27,'drawMjCount':_0x58ab0a});const _0x9d283f=(0x0,date_1['default'])(new Date())[_0x41f654(0x1d5)](0x1,_0x41f654(0x204))[_0x41f654(0x1fe)]('YYYY-MM-DD'),_0x1b8046=await this['signinEntity'][_0x41f654(0x1f1)]({'where':{'userId':_0x2891d8,'signInDate':_0x9d283f}});if(_0x1b8046){common_1[_0x41f654(0x1f8)][_0x41f654(0x1ef)]('用户'+_0x2891d8+_0x41f654(0x206),'SigninService');const _0x204266=await this[_0x41f654(0x1eb)][_0x41f654(0x1f1)]({'where':{'id':_0x2891d8}});if(!_0x204266)throw new common_1['HttpException'](_0x41f654(0x1d4),common_1[_0x41f654(0x1e4)][_0x41f654(0x1e5)]);const {consecutiveDays:consecutiveDays=0x0}=_0x204266;await this[_0x41f654(0x1eb)][_0x41f654(0x1c7)]({'id':_0x2891d8},{'consecutiveDays':consecutiveDays+0x1});}else common_1[_0x41f654(0x1f8)][_0x41f654(0x1ef)]('用户'+_0x2891d8+'昨天没签到、今天重置天数！',_0x41f654(0x203)),await this[_0x41f654(0x1eb)][_0x41f654(0x1c7)]({'id':_0x2891d8},{'consecutiveDays':0x1});return _0x41f654(0x1dc);}async[_0x511141(0x1ea)](_0x4a6b9b){const _0xc55fd0=_0x511141;try{const {id:_0x5f3e9e}=_0x4a6b9b[_0xc55fd0(0x1ce)],_0x3aaa48=(0x0,date_1['default'])()[_0xc55fd0(0x1ff)](_0xc55fd0(0x1d9))[_0xc55fd0(0x1fe)](_0xc55fd0(0x1e2)),_0x52f2a4=(0x0,date_1[_0xc55fd0(0x1c3)])()[_0xc55fd0(0x1bf)]('month')[_0xc55fd0(0x1fe)](_0xc55fd0(0x1e2)),_0x24504b=this[_0xc55fd0(0x1c8)][_0xc55fd0(0x1cd)](_0xc55fd0(0x205)),_0x367ec4=await _0x24504b['select'](_0xc55fd0(0x1d0))[_0xc55fd0(0x1da)]('signin.userId\x20=\x20:userId',{'userId':_0x4a6b9b['user']['id']})[_0xc55fd0(0x1da)](_0xc55fd0(0x1de),{'firstDay':_0x3aaa48})[_0xc55fd0(0x1da)](_0xc55fd0(0x201),{'lastDay':_0x52f2a4})['getRawMany'](),_0xdf77b8=new Date(_0x3aaa48),_0x339cbc=new Date(_0x52f2a4),_0x4f7076=[],_0x421809=new Date(_0xdf77b8);while(_0x421809<=_0x339cbc){_0x4f7076[_0xc55fd0(0x207)]((0x0,date_1[_0xc55fd0(0x1c3)])(new Date(_0x421809))['format'](_0xc55fd0(0x1f3))),_0x421809[_0xc55fd0(0x1c1)](_0x421809[_0xc55fd0(0x1bd)]()+0x1);}const _0x5804bc=[];for(const _0x156786 of _0x4f7076){const _0x4a6272=_0x367ec4['find'](_0xe058ce=>_0xe058ce[_0xc55fd0(0x202)]===_0x156786);!_0x4a6272?_0x5804bc[_0xc55fd0(0x207)]({'signInDate':_0x156786,'isSigned':![]}):(_0x4a6272[_0xc55fd0(0x1bb)]=!![],_0x5804bc[_0xc55fd0(0x207)](_0x4a6272));}return _0x5804bc;}catch(_0xfc2d23){console[_0xc55fd0(0x1ba)](_0xc55fd0(0x1fb),_0xfc2d23);throw new common_1[(_0xc55fd0(0x1e7))]('获取签到数据失败！',common_1[_0xc55fd0(0x1e4)][_0xc55fd0(0x1e5)]);}}};SigninService=__decorate([(0x0,common_1[_0x511141(0x1d2)])(),__param(0x0,(0x0,typeorm_1[_0x511141(0x1f9)])(signIn_entity_1[_0x511141(0x1e0)])),__param(0x1,(0x0,typeorm_1[_0x511141(0x1f9)])(user_entity_1[_0x511141(0x1db)])),__metadata(_0x511141(0x1ec),[typeorm_2['Repository'],typeorm_2[_0x511141(0x1f7)],userBalance_service_1[_0x511141(0x1d7)],globalConfig_service_1[_0x511141(0x1e6)]])],SigninService),exports[_0x511141(0x203)]=SigninService;