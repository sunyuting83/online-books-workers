function handleOptions(request) {
  // Make sure the necesssary headers are present
  // for this to be a valid pre-flight request
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check the requested method + headers
    // you can do that here.
    return new Response(null, {
      headers: corsHeaders,
    })
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS',
      },
    })
  }
}
addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (url.pathname.startsWith(proxyEndpoint)) {
    if (request.method === 'OPTIONS') {
      // Handle CORS preflight requests
      event.respondWith(handleOptions(request))
    } else if (
      request.method === 'GET' ||
      request.method === 'HEAD' ||
      request.method === 'POST'
    ) {
      // Handle requests to the API server
      event.respondWith(handleRequest(request))
    } else {
      event.respondWith(async () => {
        return new Response(null, {
          status: 405,
          statusText: 'Method Not Allowed',
        })
      })
    }
  } else {
    // Serve demo page
    event.respondWith(handleRequest(event.request))
  }
})
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
const proxyEndpoint = '/api/'
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const init = {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  }
  const path = get_path(request.url)
  const query = get_query(request.url)
  const some = await router({
    path: path,
    query: query
  })
  response = new Response(JSON.stringify(some), init)
  // Recreate the response so we can modify the headers
  // Set CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  // Append to/Add Vary header so browser will cache response correctly
  response.headers.append('Vary', 'Origin')
  return response
}

/**
 * get path function
 * @param {String} url
 */
function get_path(url) {
  if(url.includes('?')) {
    return url.substring(url.lastIndexOf('.dev') + 4, url.lastIndexOf('?'))
  }else {
    return url.substring(url.lastIndexOf('.dev') + 4, url.length)
  }
}

/**
 * get query function
 * @param {String} url
 * @return {String} query
 */
function get_query(url) {
  var theRequest = new Object();
  if (url.includes("?")) {
    var str = url.substr(url.lastIndexOf('?')+1);
    strs = str.split("&");
    for(var i = 0; i < strs.length; i ++) {
      theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
    }
  }
  return theRequest;
}

/**
 * Router
 * @param {String} path
 * @param {String} query
 */
async function router(ctx) {
  let body = {}
  const path = ctx.path
  let { id, page, bookid } = ctx.query
  if(page == undefined) page = '1'
  if(id == undefined) id = '1'
  switch (path) {
    case '/api/index':
      body = await getBody(RootUrl,'index')
      break;
    case '/api/category':
      body = await getBody(RootUrl, 'getcategory')
      break;
    case '/api/trophy':
      let trophy = 'trophy'
      if (id === 'quanben') trophy = 'quanben'
      body = await getBody(TrophyUrl(id, page), trophy)
      break;
    case '/api/detail':
      body = await getBody(DetailUrl(id), 'detail')
      break;
    case '/api/writer':
      body = await getBody(WriterUrl(id), 'writer')
      break;
    case '/api/categorylist':
      body = await getBody(CategoryUrl(id,page), 'category')
      break;
    case '/api/search':
      body = await getBody(SearchUrl(id,page), 'search')
      break;
    case '/api/book':
      body = await getBody(ReadUrl(bookid ,id), 'book')
      break;
    default:
      body = {
        status: 404
      }
      break;
  }
  return body
}

iconv = require('iconv-lite')
async function getBody(url, pages = '') {
  const headers = {
      "Accept": 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      "Accept-Language": 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
      "Connection": "keep-alive",
      "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0;"
    }
  let response = await fetch(url,{
      "body": null,
      "encoding":null,
      "method": "GET",
      "headers": headers
  })
  let buffer = await response.arrayBuffer()
  let array = new Uint8Array(buffer)
  let str = await iconv.decode(array, 'gbk')
  let json = await makeData(pages, str)
  return json
}

async function makeData(page, data) {
  let json = {}
  switch (page) {
    case 'index':
      json = await IndexJson(data)
      break
    case 'getcategory':
      json = await Category(data)
      break
    case 'trophy':
      json = await TrophyJson(data)
      break
    case 'quanben':
      json = await AllBooks(data)
      break
    case 'detail':
      json = await BookJson(data)
      break
    case 'writer':
      json = await writerJson(data)
      break
    case 'category':
      json = await catagoryJson(data)
      break
    case 'search':
      json = await writerJson(data)
      break
    case 'book':
      json = await readJson(data)
      break
    default:
      json = await IndexJson(data)
      break
  }
  return json
}

const RootUrl = 'https://www.qb5.tw/'
const TrophyUrl = (id = '', page = '') => {
  if (id === 'quanben')  return `${RootUrl}${id}/${page}`
  return `${RootUrl}top/${id}/${page}.html`
}
const DetailUrl = (id = '') => {
  return `${RootUrl}shu/${id}.html`
}
const CategoryUrl = (id = '1', page = '1') => {
  return `${RootUrl}list/${id}/${page}.html`
}
const WriterUrl = (id = '') => {
  id = encode(id, 'gbk')
  // console.log(id)
  const url = `${RootUrl}modules/article/authorarticle.php?author=${id}`
  return url
}

const SearchUrl = (id = '', page = '') => {
  id = encode(id, 'gbk')
  const url = `${RootUrl}modules/article/search.php?searchtype=articlename&searchkey=${id}&page=${page}`
  return url
}

const ReadUrl = (bookid = '', id = '') => {
  return `${RootUrl}shu/${bookid}/${id}.html`
}

function encode(str = '', charset = '') {
  str = iconv.decode(str, 'utf8')
  var buf = iconv.encode(str, 'gbk');
  var encodeStr = '';
  var ch = '';
  for (var i = 0; i < buf.length; i++) {
    ch = buf[i].toString(16);
    if (ch.length === 1) {
      ch = '0' + ch;
    }
    encodeStr += '%' + ch;
  }
  encodeStr = encodeStr.toUpperCase();
  return encodeStr;
}
const GlobalTitle = '免费小说-最新小说连载免费在线观看-笔趣阁'
const SliderRoot = 'https://www.r5k.com/'
const TabLabe = [
  {
    id: 0,
    title: '书架',
    icon: 'archive',
    link: '/mybook'
  },
  {
    id: 1,
    title: '书城',
    icon: 'shopping-bag',
    link: '/'
  },
  {
    id: 2,
    title: '排行',
    icon: 'trophy',
    link: '/trophy'
  },
]

const indexMenu = [
  {
    id: 0,
    title: '热门',
    icon: 'fa-free-code-camp',
    color: 'color:#fd6b67'
  },
  {
    id: 1,
    title: '排行',
    icon: 'fa-bar-chart',
    color: 'color:#6eccc6'
  },
  {
    id: 2,
    title: '人气',
    icon: 'fa-gg',
    color: 'color:#fd8a3f'
  }, {
    id: 3,
    title: '入库',
    icon: 'fa-cube',
    color: 'color:#74a8e6'
  },
  {
    id: 4,
    title: '最新',
    icon: 'fa-star',
    color: 'color:#aaca31'
  }
]

const slider = [
  `${SliderRoot}p/images/banner01.jpg`,
  `${SliderRoot}p/images/banner02.jpg`,
  `${SliderRoot}p/images/banner03.jpg`,
  `${SliderRoot}p/images/banner04.jpg`,
  `${SliderRoot}p/images/banner05.jpg`
]


const cheerio = require('cheerio')

async function Category (data = '') {
  let json = {
    status: 0,
    category: []
  }
  const $ = cheerio.load(data)
  const $ls = $('body').children('div#head').children('div.head_t').children('ul').children('li')
  $ls.each(function (index, element) {
    if (index > 0 && index < $ls.length - 2) {
      const title = $(element).children('a').text()
      let id = $(element).children('a').attr('href')
      id = id.substring(id.lastIndexOf('/') + 1, id.lastIndexOf('.'))
      // console.log(id)
      json.category = [
        ...json.category,
        {
          'title': title,
          'id': id
        }
      ]
    }
  })
  const $root = $('body').children('div#main').children('div#mainleft')
  const category = $($root).find('div.titletop')
  let co = []
  category.each(function (i, element) {
    const rot = $(element).children('ul').children('li').first()
    const first = $(rot).children('div.text')
    const first_id = makeBookId($(first).children('strong').children('a').attr('href'))
    const cover = makeImgUrl(first_id)
    co = [...co, cover]
    if (i <= 5) {
      json.category[i].cover = co[i]
    }
  })
  const catrt = $($root).find('div.titletop').children('ul')
  const categorya = $(catrt).first().children('li').last()
  const id = makeBookId($(categorya).children('a').attr('href'))
  const lcover = makeImgUrl(id)
  const categoryb = $(catrt).first().children('li').eq(3)
  const ida = makeBookId($(categoryb).children('a').attr('href'))
  const lcovera = makeImgUrl(ida)
  json.category[json.category.length - 1].cover = lcover
  json.category[json.category.length - 2].cover = lcovera
  return json
}

// index数据
async function IndexJson (data = '') {
  let json = {
    status: 0,
    slider: [],
    category: [],
    newlist: [],
    recommend: [],
    some: []
  }
  const $ = cheerio.load(data, { decodeEntities:false})
  const $root = $('body').children('div#main').children('div#mainleft')
  const category = $($root).find('div.titletop')
  category.each(function (i, element) {
    let title = $(element).children('h3').text()
    if (title.indexOf('|') !== -1) title = title.split('|')[0]
    let ca_json = {
      title: title,
      first: {},
      list: []
    }
    const rot = $(element).children('ul').children('li')
    let sliders = []
    rot.each(function (index, element) {
      if (index === 0) {
        const first = $(element).children('div.text')
        const first_title = $(first).children('strong').children('a').text()
        const first_id = Number(makeBookId($(first).children('strong').children('a').attr('href')))
        const first_cover = makeImgUrl(first_id)
        const writer = $(first).children('p').text().split(' ')[1].split(':')[1]
        sliders = {
          ...sliders,
          id: first_id,
          title: first_title,
          cover: slider[i],
          writer: writer
        }
      }
      if (index !== 0) {
        const title = $(element).children('a').text()
        const id = makeBookId($(element).children('a').attr('href'))
        const cover = makeImgUrl(id)
        const writer = $(element).children('span').text()
        ca_json.list = [...ca_json.list, {
          id: id,
          title: title,
          cover: cover,
          writer: writer
        }]
      }
    })
    if (i <= 4) {
      json.slider = [...json.slider, sliders]
    }
    json.category = [...json.category, ca_json]
  })
  const hotlist = $($root).find('div#container').children('div.item')
  hotlist.each(function (index, element) {
    const rot = $(element).children('div.txt').children('dl')
    const id = makeBookId($(rot).children('dt').children('a').attr('href'))
    const title = $(rot).children('dt').children('a').text()
    const cover = makeImgUrl(id)
    const writer = $(rot).children('dd').first().text().split('：')[1]
    const intro = $(rot).children('dd.info').text()
    json.recommend = [...json.recommend, {
      id: id,
      title: title,
      writer: writer,
      cover: cover,
      intro: intro
    }]
  })
  const rt = $('body').children('div#main').children('div#mainright').children('div.titletop')
  rt.each(function (index, element) {
    if (index > 0) {
      let bklist = []
      const list = $(element).children('ul').children('li')
      list.each(function (index, element) {
        const id = makeBookId($(element).children('a').attr('href'))
        const title = $(element).children('a').text()
        const cover = makeImgUrl(id)
        bklist = [...bklist, {
          id: id,
          title: title,
          cover: cover
        }]
      })
      json.some = [...json.some, bklist]
    }
  })
  const newrt = $($root).children('div.uplist').children('div#tlist')
  const newl = $(newrt).children('ul').children('li')
  let nls = []
  newl.each(function (index, element) {
    const id = makeBookId($(element).children('div.zp').children('a').attr('href'))
    const cover = makeImgUrl(id)
    const title = $(element).children('div.zp').children('a').text()
    nls = [...nls, {
      id: id,
      cover: cover,
      title: title
    }]
  })
  json.some = [...json.some, nls]
  return json
}

async function TrophyJson (data = '') {
  let json = {
    status: 0,
    list: [],
    menu: [],
    lastpage: 0
  }
  const $ = cheerio.load(data)
  const list = $('body').children('div#main').children('div#articlelist').children('ul').last().children('li')
  list.each(function (index, element) {
    const title = $(element).children('span.l2').children('a').text()
    const id = makeBookId($(element).children('span.l2').children('a').attr('href'))
    const cover = makeImgUrl(id)
    const writer = $(element).children('span.l3').text()
    const last = $(element).children('span.l4').children('a')
    const last_title = $(last).text()
    let last_id = makeLastId($(last).attr('href'))
    json.list = [...json.list, {
      title: title,
      id: id,
      cover: cover,
      last: {
        last_title: last_title,
        last_id: last_id
      },
      writer: writer
    }]
  })
  const menuls = $('body').children('div#main').children('div.articlemenu').children('ul').children('li')
  menuls.each(function (index, element) {
    let id = $(element).children('a').attr('href')
    id = id.substring(0, id.length - 1)
    id = id.substring(id.lastIndexOf('/') + 1, id.length)
    const title = $(element).children('a').text()
    json.menu = [...json.menu, {
      id: id,
      title: title
    }]
  })
  const menulist = $('body').find('div.head_t').children('ul').children('li')
  let allbook = {}
  menulist.each(function (index, element) {
    const name = $(element).children('a').text()
    if (name.indexOf('全本') !== -1) {
      let id = $(element).children('a').attr('href')
      id = id.substring(0, id.length - 1)
      id = id.substring(id.lastIndexOf('/') + 1, id.length)
      allbook = {
        id: id,
        title: name
      }
    }
  })
  json.menu = [...json.menu, allbook]
  const last_page = Number($('body').children('div#main').children('div.articlepage').children('div.pagelink').children('div.pagelink').children('a.last').text())
  json.lastpage = last_page
  return json
}

async function AllBooks (data = '') {
  let json = {
    status: 0,
    list: [],
    menu: [],
    lastpage: 0
  }
  const $ = cheerio.load(data)
  const list = $('body').children('div#main').find('div.leftBox').find('ul.titlelist').children('li')
  list.each(function (index, element) {
    const title = $(element).children('div.zp').children('a').text()
    const id = makeBookId($(element).children('div.zp').children('a').attr('href'))
    const cover = makeImgUrl(id)
    const writer = $(element).children('div.author').text()
    const last = $(element).children('div.zz').children('a')
    const last_title = $(last).text()
    let last_id = makeLastId($(last).attr('href'))
    json.list = [...json.list, {
      title: title,
      id: id,
      cover: cover,
      last: {
        last_title: last_title,
        last_id: last_id
      },
      writer: writer
    }]
  })
  const last_page = Number($('body').children('div#main').find('div.leftBox').children('div.uplist').children('div.articlepage').children('div.pagelink').children('div.pagelink').children('a.last').text())
  json.lastpage = last_page
  return json
}

// make Book Json
async function BookJson (data = '') {
  let json = {
    status: 0,
    book: {},
    list: [],
    recommend: []
  }
  const $ = cheerio.load(data)
  const root = $('body').children('div#main').children('div#bookdetail')
  const recommend = $(root).children('p.tjlist').children('a')
  recommend.each(function (index, element) {
    // console.log(element)
    const title = $(element).text()
    const id = makeBookId($(element).attr('href'))
    const cover = makeImgUrl(id)
    json.recommend = [...json.recommend, {
      id: id,
      title: title,
      cover: cover
    }]
  })
  const infoRoot = $(root).children('div#info')
  const title = $(infoRoot).children('h1').text()
  let id = $(root).children('div.nav-mbx').children('div.fr').children('a').attr('href')
  id = id.substring(id.lastIndexOf('_') + 1, id.lastIndexOf('/'))
  const cover = makeImgUrl(Number(id))
  const writer = $(infoRoot).children('div.options').children('a').first().text().split('：')[1]
  const readed = $(infoRoot).children('div.options').children('span.item').eq(1).text().split('：')[1]
  const textnb = $(infoRoot).children('div.options').children('span.item').first().text().split('：')[1]
  const last = $(infoRoot).children('div.update').children('a')
  let last_id = makeLastId($(last).attr('href'))
  const last_title = $(last).text()
  let intro = $(infoRoot).children('div#intro').text().split(/\n/)
  intro = intro.filter(x => x !== '')
  let status
  let statu = $(root).children('div#picbox').children('div.img_in').children('span').attr('class')
  if (statu === 'b') {
    status = false
  } else {
    status = true
  }
  let book = {
    title: title,
    cover: cover,
    writer: writer,
    readed: readed,
    textnb: textnb,
    last: {
      id: last_id,
      title: last_title
    },
    status: status,
    intro: intro
  }
  json.book = book
  const lsroot = $('body').children('div.zjbox').children('dl.zjlist').children('dd')
  lsroot.each(function (index, element) {
    const lsa = $(element).children('a')
    if (lsa) {
      const title = $(lsa).text()
      const id = makeLastId($(lsa).attr('href'))
      if(id !== 0) {
        json.list = [...json.list, {
          id: id,
          title: title,
          sort: index
        }]
      }
    }
  })
  return json
}

// make writer json
async function writerJson (data = '') {
  let json = {
    status: 0,
    list: [],
    bookid: 0,
    lastpage: 0
  }
  const $ = cheerio.load(data)
  const list = $('body').children('div#main').children('table.grid').children('tbody').children('tr')
  // console.log($('body').children('div#main').children('table.grid').children('tbody').children('tr'))
  if (list.length > 0) {
    list.each(function (index, element) {
      // console.log(element)
      if (index !== 0) {
        const wrt = $(element).children('td').first().children('a')
        const id = makeBookId($(wrt).attr('href'))
        const title = $(wrt).text()
        const cover = makeImgUrl(id)
        const last_id = makeLastId($(element).children('td').eq(1).children('a').attr('href'))
        const last_title = $(element).children('td').eq(1).children('a').text()
        const number = $(element).children('td').eq(3).text()
        const writer = $(element).children('td').eq(2).text()
        let status
        let statu = $(element).children('td').last().text()
        if (statu === '连载中') {
          status = true
        } else {
          status = false
        }
        json.list = [...json.list, {
          id: id,
          title: title,
          cover: cover,
          last: {
            last_id: last_id,
            last_title: last_title
          },
          number: number,
          status: status,
          writer: writer
        }]
      }
    })
    const last_page = Number($('body').children('div#main').children('div.articlepage').children('div.pagelink').children('div.pagelink').children('a.last').text())
    json.lastpage = last_page
  } else {
    let bookid = String(makeBookId($('body').children('div#main').children('div#bookdetail').children('div.nav-mbx').children('div.fr').children('a').attr('href')))
    json.bookid = Number(bookid.substring(bookid.lastIndexOf('_') + 1, bookid.lastIndexOf('/')))
    json.status = 5
  }
  return json
}

// make catagory json
async function catagoryJson (data = '') {
  let json = {
    status: 0,
    list: [],
    slider: [],
    lastpage: 0,
    title: ''
  }
  const $ = cheerio.load(data)
  const root = $('body').children('div#main').children('div#main')
  const sliders = $(root).children('div.tjbox').children('div.shu_cont').children('div.shu_box')
  sliders.each(function (index, element) {
    const rt = $(element).children('div.shu_xinxi').children('h4').children('a')
    const id = makeBookId($(rt).attr('href'))
    const cover = makeImgUrl(id)
    const title = $(rt).text()
    const intro = $(element).children('div.shu_xinxi').children('p').text()
    json.slider = [...json.slider, {
      id: id,
      title: title,
      cover: cover,
      intro: intro
    }]
  })
  const list = $(root).children('div.leftBox').children('div.uplist').children('div#tlist').children('ul.titlelist').children('li')
  // console.log($(list))
  list.each(function (index, element) {
    const tr = $(element).children('div.zp').children('a')
    const id = makeBookId($(tr).attr('href'))
    const cover = makeImgUrl(id)
    const title = $(tr).text()
    const writer = $(element).children('div.author').text()
    const last = $(element).children('div.zz').children('a')
    const last_id = makeLastId($(last).attr('href'))
    const last_title = $(last).text()
    json.list = [...json.list, {
      title: title,
      id: id,
      cover: cover,
      last: {
        last_title: last_title,
        last_id: last_id
      },
      writer: writer
    }]
  })
  const last_page = Number($(root).children('div.leftBox').children('div.uplist').children('div.articlepage').children('div.pagelink').children('div.pagelink').children('a.last').text())
  json.lastpage = last_page
  let title = $(root).children('div.rightBox').children('div.visitlist').children('h3').text()
  title = title.substring(0, title.lastIndexOf('人'))
  json.title = title
  return json
}

async function readJson (data = '') {
  let json = {
    status: 0,
    nav: ''
  }
  const $ = cheerio.load(data)
  let title = $('body').children('div#main').children('h1').text()
  let nav = $('body').children('div#main').children('div#readbox').children('div#content').text()
  let newnav = nav.split(/\n/)
  newnav = newnav.filter(x => x !== '')
  newnav = newnav.filter(x => x.indexOf('全本小说网') === -1)
  json.nav = `<h1>${title}</h1>` + newnav.join('<br />')
  return json
}

// make book id
function makeBookId (url = '') {
  return Number(url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')))
}

// make last book id
function makeLastId (url = '') {
  return Number(url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')))
}

function Img2Base64 (url = '', bookid = 0) {
  return new Promise((resolve, reject) => {
    var newImg = new Image()
    newImg.src = `${url}`
    // console.log(newImg.src)
    newImg.crossOrigin = 'Anonymous';
    let data = '' //存储压缩后的图片
    newImg.onload = () => { // 图片加载成功后把地址给原来的img
      let canvas = document.createElement('canvas') //创建一个canvas元素
      let context = canvas.getContext('2d') //context相当于画笔，里面有各种可以进行绘图的API
      const imageWidth = 10 //压缩后图片的宽度，这里设置为缩小一半
      const imageHeight = (newImg.height * 10) / newImg.width //压缩后图片的高度，这里设置为缩小一半

      canvas.width = imageHeight //设置绘图的宽度
      canvas.height = imageWidth //设置绘图的高度

      //使用drawImage重新设置img标签中的图片大小，实现压缩。drawImage方法的参数可以自行查阅W3C
      context.drawImage(newImg, 0, 0, imageHeight, imageWidth)

      //使用toDataURL将canvas上的图片转换为base64格式
      data = canvas.toDataURL('image/jpeg', 0.1)
      resolve(data)
      // localStorage.setItem(`cover:${bookid}`, data)
    }
  })
}

// make img url
function makeImgUrl (id = 0) {
  let imgid = 0
  id = Number(id)
  if (id < 1000) {
    imgid = 0
  } else if (id >= 1000 && id < 10000) {
    imgid = Number(String(id).substring(0, 1))
  } else if (id >= 10000 && id < 100000) {
    imgid = Number(String(id).substring(0, 2))
  } else if (id >= 100000) {
    imgid = Number(String(id).substring(0, 3))
  }
  return `${RootUrl}files/article/image/${imgid}/${id}/${id}s.jpg`
}