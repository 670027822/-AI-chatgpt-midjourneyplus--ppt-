'use strict';function _0x2c7c(){const _0x194499=['PORT','@nestjs/core','\x20-\x20收到来自\x20','ValidationPipe','set','json','templates/pages','NestFactory','58485qqxetP','./config/main','96852SQndRg','resolve','186kBMIuT','path','服务启动成功:\x20http://localhost:','APIPREFIX','964280ItUwjl','getHttpAdapter','24HlpYZl','Main','timeout','6533549ziwZIK','491100uCABfw','enableCors','./common/filters/typeOrmQueryFailed.filter','TransformInterceptor','log','originalUrl','useGlobalPipes','AppModule','use','210670kmbOUf','getInstance','body','headers','method','express-xml-bodyparser','.env','./modules/database/initDatabase','44XZEcRV','6906yHtIdc','config','useGlobalFilters','compression','AllExceptionsFilter','./app.module','请求体:','\x20请求:\x20','9lClYiz','toISOString','hbs','view\x20engine','./common/interceptors/transform.interceptor','create','useGlobalInterceptors','dotenv','./common/filters/allExceptions.filter','body-parser','listen','Logger','views','defineProperty','./public','5mb'];_0x2c7c=function(){return _0x194499;};return _0x2c7c();}function _0x28e9(_0x58d954,_0x1bbaf1){const _0x2c7c93=_0x2c7c();return _0x28e9=function(_0x28e9b4,_0x2aaddb){_0x28e9b4=_0x28e9b4-0x75;let _0xa8be0=_0x2c7c93[_0x28e9b4];return _0xa8be0;},_0x28e9(_0x58d954,_0x1bbaf1);}const _0x2abacd=_0x28e9;(function(_0x2a19de,_0x4746aa){const _0x1711c8=_0x28e9,_0x3c0eab=_0x2a19de();while(!![]){try{const _0x3f0208=parseInt(_0x1711c8(0x7c))/0x1+parseInt(_0x1711c8(0x85))/0x2*(parseInt(_0x1711c8(0xa9))/0x3)+-parseInt(_0x1711c8(0x84))/0x4*(-parseInt(_0x1711c8(0xa5))/0x5)+parseInt(_0x1711c8(0xb3))/0x6+parseInt(_0x1711c8(0xa7))/0x7*(parseInt(_0x1711c8(0xaf))/0x8)+-parseInt(_0x1711c8(0x8d))/0x9*(-parseInt(_0x1711c8(0xad))/0xa)+-parseInt(_0x1711c8(0xb2))/0xb;if(_0x3f0208===_0x4746aa)break;else _0x3c0eab['push'](_0x3c0eab['shift']());}catch(_0x16fcda){_0x3c0eab['push'](_0x3c0eab['shift']());}}}(_0x2c7c,0x2bc32));Object[_0x2abacd(0x9a)](exports,'__esModule',{'value':!![]});const Dotenv=require(_0x2abacd(0x94));Dotenv[_0x2abacd(0x86)]({'path':_0x2abacd(0x82)});const core_1=require(_0x2abacd(0x9e)),app_module_1=require(_0x2abacd(0x8a)),swagger_1=require('./common/swagger'),allExceptions_filter_1=require(_0x2abacd(0x95)),typeOrmQueryFailed_filter_1=require(_0x2abacd(0x75)),common_1=require('@nestjs/common'),transform_interceptor_1=require(_0x2abacd(0x91)),main_1=require(_0x2abacd(0xa6)),initDatabase_1=require(_0x2abacd(0x83)),compression=require(_0x2abacd(0x88)),xmlBodyParser=require(_0x2abacd(0x81)),path_1=require(_0x2abacd(0xaa)),bodyParser=require(_0x2abacd(0x96));async function bootstrap(){const _0x5f1d67=_0x2abacd;await(0x0,initDatabase_1['initDatabase'])();const _0x59c391=await core_1[_0x5f1d67(0xa4)][_0x5f1d67(0x92)](app_module_1[_0x5f1d67(0x7a)]);_0x59c391[_0x5f1d67(0x7b)](compression());const _0x5f2965=(0x0,path_1[_0x5f1d67(0xa8)])(__dirname,_0x5f1d67(0x9b));_0x59c391[_0x5f1d67(0x7b)](xmlBodyParser()),_0x59c391[_0x5f1d67(0x7b)](bodyParser[_0x5f1d67(0xa2)]({'limit':_0x5f1d67(0x9c)})),_0x59c391['use']((_0x54d1d5,_0x2a4eec,_0x1262b0)=>{const _0x10cd4d=_0x5f1d67;console[_0x10cd4d(0x77)](new Date()[_0x10cd4d(0x8e)]()+_0x10cd4d(0x9f)+_0x54d1d5[_0x10cd4d(0x80)]+_0x10cd4d(0x8c)+_0x54d1d5[_0x10cd4d(0x78)]),console[_0x10cd4d(0x77)]('请求头:',_0x54d1d5[_0x10cd4d(0x7f)]),console[_0x10cd4d(0x77)](_0x10cd4d(0x8b),_0x54d1d5[_0x10cd4d(0x7e)]),_0x1262b0();}),_0x59c391[_0x5f1d67(0xb4)](),_0x59c391['setGlobalPrefix'](main_1[_0x5f1d67(0xac)]),_0x59c391[_0x5f1d67(0x93)](new transform_interceptor_1[(_0x5f1d67(0x76))]()),_0x59c391[_0x5f1d67(0x87)](new typeOrmQueryFailed_filter_1['TypeOrmQueryFailedFilter']()),_0x59c391[_0x5f1d67(0x87)](new allExceptions_filter_1[(_0x5f1d67(0x89))]()),_0x59c391[_0x5f1d67(0x79)](new common_1[(_0x5f1d67(0xa0))]()),_0x59c391[_0x5f1d67(0xae)]()[_0x5f1d67(0x7d)]()[_0x5f1d67(0xa1)](_0x5f1d67(0x99),_0x5f1d67(0xa3)),_0x59c391[_0x5f1d67(0xae)]()[_0x5f1d67(0x7d)]()['set'](_0x5f1d67(0x90),_0x5f1d67(0x8f)),(0x0,swagger_1['createSwagger'])(_0x59c391);const _0x2f08de=await _0x59c391[_0x5f1d67(0x97)](main_1[_0x5f1d67(0x9d)],()=>{const _0x3f870d=_0x5f1d67;common_1[_0x3f870d(0x98)][_0x3f870d(0x77)](_0x3f870d(0xab)+main_1[_0x3f870d(0x9d)]+'/nineai/swagger/docs',_0x3f870d(0xb0));});_0x2f08de[_0x5f1d67(0xb1)]=0x5*0x3c*0x3e8;}bootstrap();