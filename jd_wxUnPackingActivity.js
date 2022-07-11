/*
活动名称：让福袋飞
活动链接：https://lzkjdz-isv.isvjcloud.com/wxUnPackingActivity/activity/activity?activityId=<活动id>
环境变量：jd_wxUnPackingActivity_activityId // 活动id
默认助力第一个CK，第一个CK失效会退出脚本
脚本自动入会，不想入会勿跑！


*/

const $ = new Env('让福袋飞');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
//IOS等用户直接用NobyDa的jd cookie

let lz_cookie = {}
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
allMessage = ""
message = ""
$.hotFlag = false
$.outFlag = false
$.activityEnd = false
let lz_jdpin_token_cookie = ''
let activityCookie = ''
let jd_wxUnPackingActivity_activityId = "";
jd_wxUnPackingActivity_activityId = $.isNode() ? (process.env.jd_wxUnPackingActivity_activityId ? process.env.jd_wxUnPackingActivity_activityId : `${jd_wxUnPackingActivity_activityId}`) : ($.getdata('jd_wxUnPackingActivity_activityId') ? $.getdata('jd_wxUnPackingActivity_activityId') : `${jd_wxUnPackingActivity_activityId}`);
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
      "open-url": "https://bean.m.jd.com/"
    });
    return;
  }
  $.activityId = jd_wxUnPackingActivity_activityId
  $.shareUuid = ""
  console.log(`活动入口: https://lzkjdz-isv.isvjcloud.com/wxUnPackingActivity/activity/activity?activityId=${$.activityId}`)
  for (let i = 0; i < cookiesArr.length; i++) {
    cookie = cookiesArr[i];
    originCookie = cookiesArr[i]
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      $.index = i + 1;
      message = ""
      $.bean = 0
      $.hotFlag = false
      $.nickName = '';
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}******\n`);
      await getUA()
      await run();
      await $.wait(3000)
      if (i == 0 && !$.actorUuid) break
      if ($.outFlag || $.activityEnd) break
      if ($.hasEnd) break
    }
  }

  if ($.outFlag) {
    let msg = '此ip已被限制，请过10分钟后再执行脚本'
    $.msg($.name, ``, `${msg}`);
    if ($.isNode()) await notify.sendNotify(`${$.name}`, `${msg}`);
  }
  if (allMessage) {
    $.msg($.name, ``, `${allMessage}`);
  }
})()
.catch((e) => $.logErr(e))
  .finally(() => $.done())

async function run() {
  try {
    $.assistCount = 0
    $.endTime = 0
    lz_jdpin_token_cookie = ''
    $.Token = ''
    $.Pin = ''
    let flag = false
    await takePostRequest('isvObfuscator');
    if ($.Token == '') {
      console.log('获取[token]失败！')
      return
    }
    await getCk()
    if (activityCookie == '') {
      console.log(`获取cookie失败`);
      return;
    }
    if ($.activityEnd === true) {
      console.log('活动结束')
      return
    }
    if ($.outFlag) {
      console.log('此ip已被限制，请过10分钟后再执行脚本\n')
      return
    }
    await takePostRequest('getSimpleActInfoVo');
    await $.wait(1000)
    await takePostRequest('getMyPing');
    if (!$.Pin) {
      console.log('获取[Pin]失败！')
      return
    }
    await takePostRequest('accessLogWithAD');
    await $.wait(1000)
    await takePostRequest('getActMemberInfo');
    if (!$.openCard) {
      $.shopactivityId = ''
      $.joinVenderId = $.venderId
      await getshopactivityId()
      for (let i = 0; i < Array(5).length; i++) {
        if (i > 0) console.log(`第${i}次 重新开卡`)
        await joinShop()
        await $.wait(500)
        if ($.errorJoinShop.indexOf('活动太火爆，请稍后再试') == -1) {
          break
        }
      }
    }
    await takePostRequest('getUserInfo');
    await $.wait(1000)
    await takePostRequest('activityContent');
    await takePostRequest('shopInfo');
    await $.wait(1000)
    if ($.index == 1) {
      console.log(`活动获取成功，助力码：${$.actorUuid}\n默认不开卡，请手动进入活动页面开卡`)
      console.log(`\n活动店铺：${$.shopName}\n开始时间：${$.startTime}\n结束时间：${$.endTime}\n助力次数：${$.unpackingPeople}`)
      console.log(`\n已有助力：${$.hasUnpackingPeople}\n还需助力：${$.needUnpackingPeople}`)
    }

    if ($.index != 1) {
      await takePostRequest('getMyFriendInfo');
      await $.wait(1000)
      await takePostRequest('unpackingInfo');
      await takePostRequest('unPacking');
      console.log($.helpStatus == 1 ? "助力成功" : $.helpStatus == 3 ? "已助力他人" : $.helpStatus == 2 ? "已助力" : "其他情况" + $.helpStatus)
    }
    if ($.index == 1) {
      $.helpCount = $.hasUnpackingPeople
    } else if ($.helpStatus == 1) {
      $.helpCount++;
    }
    console.log(`\n【账号${$.index}】已有助力：${$.hasUnpackingPeople}${$.index != 1 && " 【账号1】已有助力：" + $.helpCount || ""}`)
    if ($.helpCount >= $.unpackingPeople) $.hasEnd = true
    if ($.hotFlag) return

    if ($.outFlag) {
      console.log('此ip已被限制，请过10分钟后再执行脚本\n')
      return
    }
    if ($.index == 1) {
      $.shareUuid = $.actorUuid
      console.log(`\n全部助力 → ${$.shareUuid}`)

    }
    if ($.index % 3 == 0) await $.wait(parseInt(Math.random() * 3000 + 3000, 10))
  } catch (e) {
    console.log(e)
  }
}

async function takePostRequest(type) {
  if ($.outFlag) return
  let domain = 'https://lzkjdz-isv.isvjcloud.com';
  let body = ``;
  let method = 'POST'
  let admJson = ''
  switch (type) {
    case 'isvObfuscator':
      url = `https://api.m.jd.com/client.action?functionId=isvObfuscator`;
      body = `body=%7B%22url%22%3A%20%22https%3A//lzkj-isv.isvjcloud.com%22%2C%20%22id%22%3A%20%22%22%7D&uuid=hjudwgohxzVu96krv&client=apple&clientVersion=9.4.0&st=1620476162000&sv=111&sign=f9d1b7e3b943b6a136d54fe4f892af05`;
      break;
    case 'getMyPing':
      url = `${domain}/customer/getMyPing`;
      body = `token=${$.Token}&fromType=APP&userId=${$.venderId}`;
      break;
    case 'shopInfo':
      url = `${domain}/wxUnPackingActivity/shopInfo`;
      body = `activityId=${$.activityId}`;
      break;
    case 'getSimpleActInfoVo':
      url = `${domain}/customer/getSimpleActInfoVo`;
      body = `activityId=${$.activityId}`;
      break;
    case 'getActMemberInfo':
      url = `${domain}/wxCommonInfo/getActMemberInfo`;
      body = `venderId=${$.venderId}&activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}`;
      break;
    case 'accessLogWithAD':
      url = `${domain}/common/accessLogWithAD`;
      let pageurl = `https://lzkjdz-isv.isvjcloud.com/wxUnPackingActivity/activity/activity?activityId=${$.activityId}&friendUuid=${$.shareUuid}`
      body = `venderId=${$.venderId}&code=${$.activityType}&pin=${encodeURIComponent($.Pin)}&activityId=${$.activityId}&pageUrl=${encodeURIComponent(pageurl)}&subType=app&adSource=`
      break;
    case 'getUserInfo':
      url = `${domain}/wxActionCommon/getUserInfo`;
      body = `pin=${encodeURIComponent($.Pin)}`
      break;
    case 'getMyFriendInfo':
      url = `${domain}/wxUnPackingActivity/getMyFriendInfo`;
      body = `friendUuid=${$.shareUuid}`;
      break;
    case 'activityContent':
      url = `${domain}/wxUnPackingActivity/activityContent`;
      body = `activityId=${$.activityId}&buyerNick=${encodeURIComponent($.Pin)}&friendUuid=${$.shareUuid}`
      break;
    case 'unpackingInfo':
      url = `${domain}/wxUnPackingActivity/unpackingInfo`;
      body = `activityId=${$.activityId}&friendUuid=${$.shareUuid}&mySelfUuid=${$.actorUuid}`
      break;
    case 'unPacking':
      url = `${domain}/wxUnPackingActivity/unPacking`;
      body = `activityId=${$.activityId}&friendUuid=${$.shareUuid}&mySelfId=${$.actorUuid}`
      break;
    case 'getPrize':
      url = `${domain}/wxUnPackingActivity/getPrize`;
      body = `activityId=${$.activityId}&pin=${encodeURIComponent($.Pin)}`
      break;
    default:
      console.log(`错误${type}`);
  }
  let myRequest = getPostRequest(url, body, method);
  // console.log(myRequest)
  return new Promise(async resolve => {
    $.post(myRequest, (err, resp, data) => {
      try {
        setActivityCookie(resp);
        if (err) {
          if (resp && typeof resp.statusCode != 'undefined') {
            if (resp.statusCode == 493) {
              console.log('此ip已被限制，请过10分钟后再执行脚本\n')
              $.outFlag = true
            }
          }
          console.log(`${$.toStr(err, err)}`)
          console.log(`${type} API请求失败，请检查网路重试`)
        } else {
          dealReturn(type, data);
        }
      } catch (e) {
        // console.log(data);
        console.log(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

async function dealReturn(type, data) {
  let res = ''
  try {
    if (type != 'accessLogWithAD' || type != 'drawContent') {
      if (data) {
        res = JSON.parse(data);
      }
    }
  } catch (e) {
    console.log(`${type} 执行任务异常`);
    console.log(data);
    $.runFalag = false;
  }
  try {
    switch (type) {
      case 'isvObfuscator':
        if (typeof res == 'object') {
          if (res.errcode == 0) {
            if (typeof res.token != 'undefined') $.Token = res.token
          } else if (res.message) {
            console.log(`isvObfuscator ${res.message || ''}`)
          } else {
            console.log(data)
          }
        } else {
          console.log(data)
        }
        break;
      case 'getMyPing':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            if (res.data && typeof res.data.secretPin != 'undefined') $.Pin = res.data.secretPin
            if (res.data && typeof res.data.nickname != 'undefined') $.nickname = res.data.nickname
            //console.log(`${type} ${data}`)
          } else if (res.errorMessage) {
            console.log(`${type} ${res.errorMessage || ''}`)
          } else {
            console.log(`${type} ${data}`)
          }
        } else {
          //console.log(`${type} ${data}`)
        }
        break;
      case 'shopInfo':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            $.shopName = res.data.shopName || ''
          } else if (res.errorMessage) {
            console.log(`${type} ${res.errorMessage || ''}`)
          } else {
            console.log(`${type} ${data}`)
          }
        } else {
          console.log(`${type} ${data}`)
        }
        break;
      case 'getSimpleActInfoVo':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            if (typeof res.data.shopId != 'undefined') $.shopId = res.data.shopId
            if (typeof res.data.venderId != 'undefined') $.venderId = res.data.venderId
            $.activityType = res.data.activityType
          } else if (res.errorMessage) {
            console.log(`${type} ${res.errorMessage || ''}`)
          } else {
            console.log(`${type} ${data}`)
          }
        } else {
          //console.log(`${type} ${data}`)
        }
        break;
      case 'getUserInfo':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            $.pinImg = res.data.yunMidImageUrl || ''
            $.jdNick = res.data.nickname || ''
          } else if (res.errorMessage) {
            console.log(`${type} ${res.errorMessage || ''}`)
          } else {
            console.log(`${type} ${data}`)
          }
        } else {
          console.log(`${type} ${data}`)
        }
        break;
      case 'activityContent':
        if (typeof res == 'object') {
          // console.log(data)
          if (res.result && res.result === true) {
            $.actorUuid = res.data.wucvo.mySelfId || ''
            $.unpackingPeople = res.data.wucvo.unpackingPeople || 0
            $.collectionCondition = res.data.wucvo.collectionCondition || true
            $.startTime = res.data.wucvo.startTime || ''
            $.endTime = res.data.wucvo.endTime || ''
            $.hasUnpackingPeople = res.data.wuivo.hasUnpackingPeople || 0
            $.needUnpackingPeople = res.data.wuivo.needUnpackingPeople || 0
            $.jpname = res.data.wdifo.name || ''
            //console.log(`${type} ${data}`)
          } else if (res.errorMessage) {
            if (res.errorMessage.indexOf("结束") > -1) $.activityEnd = true
            console.log(`${res.errorMessage || ''}`)
          } else {
            console.log(`${data}`)
          }
        } else {
          console.log(`${data}`)
        }
        break;
      case 'getMyFriendInfo':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            console.log(`准备助力 => ${res.data.nickname || ''}`)
          } else if (res.errorMessage) {
            console.log(`${type} ${res.errorMessage || ''}`)
          } else {
            console.log(`${type} ${data}`)
          }
        } else {
          console.log(`${type} ${data}`)
        }
        break;
      case 'unpackingInfo':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            $.helpStatus = res.data.shareStatus || 0
          } else if (res.errorMessage) {
            console.log(` ${res.errorMessage || ''}`)
          } else {
            console.log(`${data}`)
          }
        } else {
          //console.log(`${type} ${data}`)
        }
        break;
      case 'unPacking':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            console.log(` ${res.errorMessage || ''}`)
          } else if (res.errorMessage) {
            console.log(`${res.errorMessage || ''}`)
          } else {
            console.log(`${data}`)
          }
        } else {
          console.log(`${type} ${data}`)
        }
        break;
      case 'drawContent':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            $.content = res.data.content || []
          } else if (res.errorMessage) {
            console.log(`${type} ${res.errorMessage || ''}`)
          } else {
            console.log(`${type} ${data}`)
          }
        } else {
          console.log(`${type} ${data}`)
        }
        break;
      case 'getActMemberInfo':
        if (typeof res == 'object') {
          if (res.result && res.result === true) {
            $.openCard = res.data.openCard || false
          } else if (res.errorMessage) {
            console.log(`${type} ${res.errorMessage || ''}`)
          } else {
            console.log(`${type} ${data}`)
          }
        } else {
          console.log(`${type} ${data}`)
        }
        break;
      case 'accessLogWithAD':
      case 'drawContent':
        break;
      default:
        console.log(`${type}-> ${data}`);
    }
    if (typeof res == 'object') {
      if (res.errorMessage) {
        if (res.errorMessage.indexOf('火爆') > -1) {
          $.hotFlag = true
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
}

function getPostRequest(url, body, method = "POST") {
  let headers = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-cn",
    "Connection": "keep-alive",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Cookie": cookie,
    "User-Agent": $.UA,
    "X-Requested-With": "XMLHttpRequest"
  }
  if (url.indexOf('https://lzkjdz-isv.isvjcloud.com') > -1) {
    headers["Origin"] = `https://lzkjdz-isv.isvjcloud.com`
    headers["Referer"] = `https://lzkjdz-isv.isvjcloud.com/wxUnPackingActivity/activity/activity?activityId=${$.activityId}&friendUuid=${$.shareUuid}`
    headers["Cookie"] = `${lz_jdpin_token_cookie && lz_jdpin_token_cookie || ''}${$.Pin && "AUTH_C_USER=" + $.Pin + ";" || ""}${activityCookie}`
  }
  // console.log(headers)
  // console.log(headers.Cookie)
  return {
    url: url,
    method: method,
    headers: headers,
    body: body,
    timeout: 30000
  };
}

function getCk() {
  return new Promise(resolve => {
    let get = {
      url: `https://lzkjdz-isv.isvjcloud.com/wxCommonInfo/token`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookie,
        "Referer": `https://lzkjdz-isv.isvjcloud.com/wxUnPackingActivity/activity/activity?activityId=${$.activityId}`,
        "User-Agent": $.UA,
      },
      timeout: 30000
    }
    $.get(get, async (err, resp, data) => {
      try {
        if (err) {
          if (resp && typeof resp.statusCode != 'undefined') {
            if (resp.statusCode == 493) {
              console.log('此ip已被限制，请过10分钟后再执行脚本\n')
              $.outFlag = true
            }
          }
          console.log(`${$.toStr(err)}`)
          console.log(`${$.name} cookie API请求失败，请检查网路重试`)
        } else {
          let end = data.match(/(活动已经结束)/) && data.match(/(活动已经结束)/)[1] || ''
          if (end) {
            $.activityEnd = true
            console.log('活动已结束')
          }
          setActivityCookie(resp)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function setActivityCookie(resp) {
  if (resp['headers']['set-cookie']) {
    cookie = `${originCookie};`
    for (let sk of resp['headers']['set-cookie']) {
      lz_cookie[sk.split(";")[0].substr(0, sk.split(";")[0].indexOf("="))] = sk.split(";")[0].substr(sk.split(";")[0].indexOf("=") + 1)
    }
    for (const vo of Object.keys(lz_cookie)) {
      cookie += vo + '=' + lz_cookie[vo] + ';'
    }
    activityCookie = cookie
  }
}

async function getUA() {
  $.UA = `jdapp;iPhone;10.1.4;13.1.2;${randomString(40)};network/wifi;model/iPhone8,1;addressid/2308460611;appBuild/167814;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`
}

function randomString(e) {
  e = e || 32;
  let t = "abcdef0123456789",
    a = t.length,
    n = "";
  for (i = 0; i < e; i++)
    n += t.charAt(Math.floor(Math.random() * a));
  return n
}

function getMaxMin(arr, maxmin) {
  if (maxmin === "max") {
    return Math.max.apply(Math, arr);
  } else if (maxmin === "min") {
    return Math.min.apply(Math, arr);
  }
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}

async function joinShop() {
  if (!$.joinVenderId) return
  return new Promise(async resolve => {
    $.errorJoinShop = '活动太火爆，请稍后再试'
    let activityId = ``
    if ($.shopactivityId) activityId = `,"activityId":${$.shopactivityId}`
    const bodyStr = `{"venderId":"${$.joinVenderId}","shopId":"${$.joinVenderId}","bindByVerifyCodeFlag":1,"registerExtend":{},"writeChildFlag":0${activityId},"channel":406}`;
    const req = {
      appid: "jd_shop_member",
      functionId: "bindWithVender",
      clientVersion: "9.2.0",
      client: "H5",
      body: JSON.parse(bodyStr)
    }
    const h5st = await getH5st('8adfb', req);
    const options = {
      url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=bindWithVender&body=${bodyStr}&clientVersion=9.2.0&client=H5&uuid=88888&h5st=${encodeURIComponent(h5st)}`,
      headers: {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'cookie': cookie,
        'origin': 'https://shopmember.m.jd.com/',
        'user-agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        data = data && data.match(/jsonp_.*?\((.*?)\);/) && data.match(/jsonp_.*?\((.*?)\);/)[1] || data
        // console.log(data)
        let res = $.toObj(data, data);
        if (res && typeof res == 'object') {
          if (res && res.success === true) {
            console.log(res.message)
            $.errorJoinShop = res.message
            if (res.result && res.result.giftInfo) {
              for (let i of res.result.giftInfo.giftList) {
                console.log(`入会获得: ${i.discountString}${i.prizeName}${i.secondLineDesc}`)
              }
            }
            console.log(``)
          } else if (res && typeof res == 'object' && res.message) {
            $.errorJoinShop = res.message
            console.log(`${res.message || ''}`)
          } else {
            console.log(data)
          }
        } else {
          console.log(data)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
async function getshopactivityId() {
  return new Promise(async resolve => {
    let body = `{"venderId":"${$.joinVenderId}","channel":406,"payUpShop":true}`
    const req = {
      appid: "jd_shop_member",
      functionId: "getShopOpenCardInfo",
      clientVersion: "9.2.0",
      client: "H5",
      body: JSON.parse(body)
    }
    const h5st = await getH5st('ef79a', req);
    const options = {
      url: `https://api.m.jd.com/client.action?appid=jd_shop_member&functionId=getShopOpenCardInfo&body=${body}&clientVersion=9.2.0&client=H5&uuid=88888&h5st=${encodeURIComponent(h5st)}`,
      headers: {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'cookie': cookie,
        'origin': 'https://shopmember.m.jd.com/',
        'user-agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        data = data && data.match(/jsonp_.*?\((.*?)\);/) && data.match(/jsonp_.*?\((.*?)\);/)[1] || data
        // console.log(data)
        let res = $.toObj(data, data);
        if (res && typeof res == 'object') {
          if (res && res.success == true) {
            // console.log($.toStr(res.result))
            console.log(`去加入店铺会员: ${res.result.shopMemberCardInfo.venderCardName || ''}`)
            $.shopactivityId = res.result.interestsRuleList && res.result.interestsRuleList[0] && res.result.interestsRuleList[0].interestsInfo && res.result.interestsRuleList[0].interestsInfo.activityId || ''
          }
        } else {
          console.log(data)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
var _0xodc='jsjiami.com.v6',_0xodc_=['‮_0xodc'],_0x2521=[_0xodc,'wrbCrMKtfQ/CgG5g','w4M/LsOpw4c=','wo7DrMKFwrkFcsObwr8=','w6Q2ccOPw7w=','w5vDvMKRw4jDqcO2woc=','woNfwoBeeg==','DUYPHDY=','BsKPw6LDjgfCjMKfLFRGbsKjEcKOGFfDux5uSEljwoZ6QMKTwo5fwqvCpBXCmVnCujVZwrrDv1c0wpbCvcK4ScOmaMKrF8Kywq9Jw7jDnMKGw6XDtndAw457aDs=','wpnCvMOAw51TesOLwrw+BsOp','wrbDkMKZRcONX8OVX8KMMTTDgSjDjTNHwqTDn0R3QEMrfcOLX8KvPcOOQhTDlsKAZcOzVjvCtMKWd8KjVMK+a1DCtcKZwoXDvxAMwpfCisOYETFFHWM+wopsF8KCwrIyXDogb2rCp3ZHw6cWw6wHbGjCuMOw','wpLDkMOQAmM=','w6k+QMOKKXvCkjJQw53Cm8KNwpPDvw==','wojCqsKwejTCjW4/GD3Cq8KIwrnDrcKqBUElw5N9wqM+fgXDu8O7w6bCrMOcwpLDmjJfwpZWwq4Fwq1gw7LDjMOuw4dKKkkqwpnDtAHCh3Elwo7DjMKMKg/DlCcAwoXCvsOPwqbDrcKhwrXCjMKEwqpJw7wMwr/DkBQzw7RXM0s=','wonCnsOyZcKM','w4hNfVt+a1TCkMKsTFzDjVNrexrChlRRw7bDtMKiQ8O1wqHDixTCpMOoXsOAw4rDmcOLw4ZzIEVrwoTCnRlOw6YFamvClsKgwpHCvVNfw7trQsODGMOaesOndMOMFcOOwrnCisKbH3BSWmhAworCr8OJwobCncOfw4HDlsKQPwjDm8KveMKqT0tWw4fDtsKZwoHDu8Ouwp8AwpvCh8Kzw5BJNMKqw7kZwovCjC3Cg8Olwow1fMK4wr/Dr8O9wp1uBUQyRGLCrMOQXMOWcifCpsOwHmdvGsO1asO+w4ckw4nCqcKjLsOvRsK6O8O6w6TDhcKldVFQwqfDt3DCncKqWsOEIcKEO8OVwpc9S2BawpXCrsOTa8O2L3XDikfCimjDvXvCmMKLwpRhGjfCgyDCviHDgUFmTzXDuyLDp8KPJ8KQAwdCfcKiSjV+w7jDhgLDjiHCuMOtw6LDl8OUwrUSwooAw6TCvsOxw6nDhTXCkcOdwovDhsKKJXDDlMKww7TChgPCtcOXwqQZK8OZwqPDkMKKF8Ktw77CmsK2GFbDrEHDlmvDo8KCQnNAw4zCs8K1wrbCnX7DjXHCllTDmA==','V8OwwqAGaw==','esKmw4vChFE=','T29odcOz','w4BLDMO6w5Y=','wqRZUFBT','jHxCNgwsjiaKxEYReQmFi.cBbom.v6=='];if(function(_0x28bbdb,_0x495e8e,_0xb751f4){function _0x56bfd2(_0x34a257,_0x308e9a,_0x114c7f,_0x5dc2ab,_0x36513e,_0x29dc1d){_0x308e9a=_0x308e9a>>0x8,_0x36513e='po';var _0x1bb5b5='shift',_0x25080a='push',_0x29dc1d='‮';if(_0x308e9a<_0x34a257){while(--_0x34a257){_0x5dc2ab=_0x28bbdb[_0x1bb5b5]();if(_0x308e9a===_0x34a257&&_0x29dc1d==='‮'&&_0x29dc1d['length']===0x1){_0x308e9a=_0x5dc2ab,_0x114c7f=_0x28bbdb[_0x36513e+'p']();}else if(_0x308e9a&&_0x114c7f['replace'](/[HxCNgwKxEYReQFBb=]/g,'')===_0x308e9a){_0x28bbdb[_0x25080a](_0x5dc2ab);}}_0x28bbdb[_0x25080a](_0x28bbdb[_0x1bb5b5]());}return 0xdf759;};function _0x39292a(){var _0x154415={'data':{'key':'cookie','value':'timeout'},'setCookie':function(_0x59c222,_0xb5c613,_0x1c2122,_0x1e0492){_0x1e0492=_0x1e0492||{};var _0x4231d0=_0xb5c613+'='+_0x1c2122;var _0x39b3b4=0x0;for(var _0x39b3b4=0x0,_0x49c193=_0x59c222['length'];_0x39b3b4<_0x49c193;_0x39b3b4++){var _0x467d7c=_0x59c222[_0x39b3b4];_0x4231d0+=';\x20'+_0x467d7c;var _0x1110c2=_0x59c222[_0x467d7c];_0x59c222['push'](_0x1110c2);_0x49c193=_0x59c222['length'];if(_0x1110c2!==!![]){_0x4231d0+='='+_0x1110c2;}}_0x1e0492['cookie']=_0x4231d0;},'removeCookie':function(){return'dev';},'getCookie':function(_0x41e7d0,_0x2d2dc8){_0x41e7d0=_0x41e7d0||function(_0x4e237f){return _0x4e237f;};var _0x2a069e=_0x41e7d0(new RegExp('(?:^|;\x20)'+_0x2d2dc8['replace'](/([.$?*|{}()[]\/+^])/g,'$1')+'=([^;]*)'));var _0x56e756=typeof _0xodc=='undefined'?'undefined':_0xodc,_0x5493d5=_0x56e756['split'](''),_0x89cd49=_0x5493d5['length'],_0x2f9d80=_0x89cd49-0xe,_0x33083e;while(_0x33083e=_0x5493d5['pop']()){_0x89cd49&&(_0x2f9d80+=_0x33083e['charCodeAt']());}var _0x32558b=function(_0x19588b,_0x26ed52,_0x2f0097){_0x19588b(++_0x26ed52,_0x2f0097);};_0x2f9d80^-_0x89cd49===-0x524&&(_0x33083e=_0x2f9d80)&&_0x32558b(_0x56bfd2,_0x495e8e,_0xb751f4);return _0x33083e>>0x2===0x14b&&_0x2a069e?decodeURIComponent(_0x2a069e[0x1]):undefined;}};function _0x14329(){var _0x262622=new RegExp('\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*[\x27|\x22].+[\x27|\x22];?\x20*}');return _0x262622['test'](_0x154415['removeCookie']['toString']());};_0x154415['updateCookie']=_0x14329;var _0x9b13b3='';var _0x53ce82=_0x154415['updateCookie']();if(!_0x53ce82){_0x154415['setCookie'](['*'],'counter',0x1);}else if(_0x53ce82){_0x9b13b3=_0x154415['getCookie'](null,'counter');}else{_0x154415['removeCookie']();}};_0x39292a();}(_0x2521,0x1bd,0x1bd00),_0x2521){_0xodc_=_0x2521['length']^0x1bd;};function _0x1eee(_0xefbc2f,_0x43dc32){_0xefbc2f=~~'0x'['concat'](_0xefbc2f['slice'](0x1));var _0x393191=_0x2521[_0xefbc2f];if(_0x1eee['mSbxEW']===undefined){(function(){var _0xed13d8=function(){var _0x36ca07;try{_0x36ca07=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x58e5a2){_0x36ca07=window;}return _0x36ca07;};var _0x417d50=_0xed13d8();var _0x1687ef='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x417d50['atob']||(_0x417d50['atob']=function(_0x3b83ec){var _0x2becc5=String(_0x3b83ec)['replace'](/=+$/,'');for(var _0x20d2fa=0x0,_0x370074,_0xb11ce1,_0x489ca4=0x0,_0x342603='';_0xb11ce1=_0x2becc5['charAt'](_0x489ca4++);~_0xb11ce1&&(_0x370074=_0x20d2fa%0x4?_0x370074*0x40+_0xb11ce1:_0xb11ce1,_0x20d2fa++%0x4)?_0x342603+=String['fromCharCode'](0xff&_0x370074>>(-0x2*_0x20d2fa&0x6)):0x0){_0xb11ce1=_0x1687ef['indexOf'](_0xb11ce1);}return _0x342603;});}());function _0x12bf55(_0x16e0b9,_0x43dc32){var _0xc15e72=[],_0x46f395=0x0,_0x9d45d9,_0x17eac8='',_0x1e7dd9='';_0x16e0b9=atob(_0x16e0b9);for(var _0x24e95f=0x0,_0x21bb7e=_0x16e0b9['length'];_0x24e95f<_0x21bb7e;_0x24e95f++){_0x1e7dd9+='%'+('00'+_0x16e0b9['charCodeAt'](_0x24e95f)['toString'](0x10))['slice'](-0x2);}_0x16e0b9=decodeURIComponent(_0x1e7dd9);for(var _0x5c9be9=0x0;_0x5c9be9<0x100;_0x5c9be9++){_0xc15e72[_0x5c9be9]=_0x5c9be9;}for(_0x5c9be9=0x0;_0x5c9be9<0x100;_0x5c9be9++){_0x46f395=(_0x46f395+_0xc15e72[_0x5c9be9]+_0x43dc32['charCodeAt'](_0x5c9be9%_0x43dc32['length']))%0x100;_0x9d45d9=_0xc15e72[_0x5c9be9];_0xc15e72[_0x5c9be9]=_0xc15e72[_0x46f395];_0xc15e72[_0x46f395]=_0x9d45d9;}_0x5c9be9=0x0;_0x46f395=0x0;for(var _0x1e3718=0x0;_0x1e3718<_0x16e0b9['length'];_0x1e3718++){_0x5c9be9=(_0x5c9be9+0x1)%0x100;_0x46f395=(_0x46f395+_0xc15e72[_0x5c9be9])%0x100;_0x9d45d9=_0xc15e72[_0x5c9be9];_0xc15e72[_0x5c9be9]=_0xc15e72[_0x46f395];_0xc15e72[_0x46f395]=_0x9d45d9;_0x17eac8+=String['fromCharCode'](_0x16e0b9['charCodeAt'](_0x1e3718)^_0xc15e72[(_0xc15e72[_0x5c9be9]+_0xc15e72[_0x46f395])%0x100]);}return _0x17eac8;}_0x1eee['bKNkMK']=_0x12bf55;_0x1eee['CZjBDP']={};_0x1eee['mSbxEW']=!![];}var _0x377fc3=_0x1eee['CZjBDP'][_0xefbc2f];if(_0x377fc3===undefined){if(_0x1eee['BnFDaT']===undefined){var _0x277d6d=function(_0xb44fce){this['tvLGop']=_0xb44fce;this['xohOfK']=[0x1,0x0,0x0];this['ZGWNOU']=function(){return'newState';};this['JNAqti']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*';this['rxfRwu']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x277d6d['prototype']['LFaIaB']=function(){var _0x115a0a=new RegExp(this['JNAqti']+this['rxfRwu']);var _0x5aeec3=_0x115a0a['test'](this['ZGWNOU']['toString']())?--this['xohOfK'][0x1]:--this['xohOfK'][0x0];return this['jRDjSt'](_0x5aeec3);};_0x277d6d['prototype']['jRDjSt']=function(_0x1bb973){if(!Boolean(~_0x1bb973)){return _0x1bb973;}return this['BnyExL'](this['tvLGop']);};_0x277d6d['prototype']['BnyExL']=function(_0x34dba3){for(var _0x25d6cb=0x0,_0x1404fb=this['xohOfK']['length'];_0x25d6cb<_0x1404fb;_0x25d6cb++){this['xohOfK']['push'](Math['round'](Math['random']()));_0x1404fb=this['xohOfK']['length'];}return _0x34dba3(this['xohOfK'][0x0]);};new _0x277d6d(_0x1eee)['LFaIaB']();_0x1eee['BnFDaT']=!![];}_0x393191=_0x1eee['bKNkMK'](_0x393191,_0x43dc32);_0x1eee['CZjBDP'][_0xefbc2f]=_0x393191;}else{_0x393191=_0x377fc3;}return _0x393191;};var _0x43064b=function(_0x438477){var _0x2a9865=!![];return function(_0x4fd243,_0x4f39d5){var _0x326b94='‮';var _0x5cc54d=_0x2a9865?function(){if(_0x326b94==='‮'&&_0x4f39d5){var _0x4cc9ae=_0x4f39d5['apply'](_0x4fd243,arguments);_0x4f39d5=null;return _0x4cc9ae;}}:function(_0x438477){};_0x2a9865=![];var _0x438477='‮';return _0x5cc54d;};}();var _0x47e4a5=_0x43064b(this,function(){var _0x3dbe3f=function(){return'\x64\x65\x76';},_0x9387a=function(){return'\x77\x69\x6e\x64\x6f\x77';};var _0x4b7d89=function(){var _0x127e68=new RegExp('\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d');return!_0x127e68['\x74\x65\x73\x74'](_0x3dbe3f['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x267d21=function(){var _0x1a9363=new RegExp('\x28\x5c\x5c\x5b\x78\x7c\x75\x5d\x28\x5c\x77\x29\x7b\x32\x2c\x34\x7d\x29\x2b');return _0x1a9363['\x74\x65\x73\x74'](_0x9387a['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x4529e5=function(_0x216f6e){var _0x2d76c1=~-0x1>>0x1+0xff%0x0;if(_0x216f6e['\x69\x6e\x64\x65\x78\x4f\x66']('\x69'===_0x2d76c1)){_0x2c80c9(_0x216f6e);}};var _0x2c80c9=function(_0xa66ea3){var _0x1a4c0a=~-0x4>>0x1+0xff%0x0;if(_0xa66ea3['\x69\x6e\x64\x65\x78\x4f\x66']((!![]+'')[0x3])!==_0x1a4c0a){_0x4529e5(_0xa66ea3);}};if(!_0x4b7d89()){if(!_0x267d21()){_0x4529e5('\x69\x6e\x64\u0435\x78\x4f\x66');}else{_0x4529e5('\x69\x6e\x64\x65\x78\x4f\x66');}}else{_0x4529e5('\x69\x6e\x64\u0435\x78\x4f\x66');}});_0x47e4a5();const jsdom=require('jsdom');let domWindow=null;async function sleep(t){var qSCgjf={'Rnmkt':function(callee,param1){return callee(param1);},'YNPKR':function(callee,param1,param2){return callee(param1,param2);}};return new Promise((resolve,reject)=>{qSCgjf[_0x1eee('‮0','d^Ud')](setTimeout,()=>{qSCgjf[_0x1eee('‮1','3gw%')](resolve,t);},t);});}async function loadH5Sdk(){var mXKQtf={'VPNXq':_0x1eee('‮2','QZvx'),'oGZQE':_0x1eee('‫3','Dr2@'),'BwsWl':function(callee,param1){return callee(param1);}};const {JSDOM}=jsdom;let resourceLoader=new jsdom['ResourceLoader']({'userAgent':_0x1eee('‮4','kTXc'),'referrer':mXKQtf[_0x1eee('‮5','lk]*')]});let virtualConsole=new jsdom[(_0x1eee('‫6','q%mL'))]();let options={'url':mXKQtf['VPNXq'],'referrer':'https://msitepp-fm.jd.com/rest/priceprophone/priceProPhoneMenu','userAgent':_0x1eee('‫7','11&4'),'runScripts':mXKQtf[_0x1eee('‮8','(0Ol')],'resources':resourceLoader,'includeNodeLocations':!![],'storageQuota':0x989680,'pretendToBeVisual':!![],'virtualConsole':virtualConsole};const dom=new JSDOM(_0x1eee('‫9','1j3e'),options);await mXKQtf[_0x1eee('‫a','1meR')](sleep,0x1f4);domWindow=dom['window'];}async function getH5st(businessId,req){var SdNZrD={'PvBoT':function(callee,param1){return callee(param1);},'uvPcL':function(x,y){return x===y;},'kPHTp':'function','okWQU':function(callee){return callee();}};let timer=null;if(!domWindow){await SdNZrD[_0x1eee('‫b','c7$d')](loadH5Sdk);}return new Promise(async resolve=>{if(SdNZrD[_0x1eee('‫c','Oddu')](typeof domWindow['signWaap'],SdNZrD[_0x1eee('‮d','LWWK')])){const h5st=await domWindow['signWaap'](businessId,req);SdNZrD[_0x1eee('‮e','1j3e')](resolve,h5st);}else{timer=setInterval(async()=>{if(typeof domWindow[_0x1eee('‮f','11&4')]==='function'){SdNZrD[_0x1eee('‫10','DR6H')](clearInterval,timer);timer=null;const h5st=await domWindow[_0x1eee('‮11','GRYh')](businessId,req);SdNZrD[_0x1eee('‮12','@Rft')](resolve,h5st);}},0x64);}});}module[_0x1eee('‮13','9w(Q')]=getH5st;;_0xodc='jsjiami.com.v6';
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),a=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:a}=t,n=i.decode(a,this.encoding);e(null,{status:s,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.isSurge()||this.isQuanX()||this.isLoon()?$done(t):this.isNode()&&process.exit(1)}}(t,e)}