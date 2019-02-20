const Client = require('promise-ftp');
const glob = require('glob');
const path = require('path');
const ora = require('ora');

function omit(obj, uselessKeys) {
  return Object.keys(obj).reduce((acc, key) => {
    return uselessKeys.includes(key) ? 
      acc :
      {...acc, [key]: obj[key]}
  }, {});
}

class ftpPut {
  constructor(config, ctx) {
    const { host, user, password, remote, mkdir } = config;
    if(!(host && user && password)) {
       throw(new Error('host、user、password为必填项'));
    }
    this.ftpConfig = omit(config, ['type']);
    this.remotePath = remote ? (remote.substring(0, 1) === '/' ? remote : `/${remote}`) : '/';
    this.ctx = ctx;
    this.conn = new Client();
  }
  closeFtp() {
    this.conn.end();
  }
  async init(ftpConfig) {
    try {
      const serverMessage = await this.conn.connect(ftpConfig);
      this.ctx.log.info('ftp connect success:', serverMessage);
    } catch (error) {
      this.ctx.log.error('ftp connect failed', error);
      return;
    }
  }
  async startUpload() {
    await this.init(this.ftpConfig);
    let {
      config: {
        public_dir
      }
    } = this.ctx;
    let filePath = path.join(public_dir, '/**/*');
    let fileList = glob.sync(filePath, {
      nodir: true
    }); // get file list
    for (let index = 0; index < fileList.length; index++) {
      let file = fileList[index];
      let uploadFilePath = file.split('/').slice(1).join('/');
      let targetPath = file.split('/').slice(1, -1).join('/');
      let spinner = ora().start();
      spinner.text = `Uploading ${file} ...`;
      // uploading
      try {
        await this.conn.mkdir(`${this.remotePath}/${targetPath}`, true);
        await this.conn.put(file, `${this.remotePath}/${uploadFilePath}`);
        spinner.succeed(`Uploading ${uploadFilePath} successed`);
      } catch (error) {
        spinner.fail(`Uploading ${uploadFilePath} failed, reason: ${error}`);
      }
    }
    this.closeFtp();
  }
}

module.exports = async function (args, cb) {
  try {
    const ftpInstance = new ftpPut(args, this); // ftp上传实例
    await ftpInstance.startUpload();
    return cb();
  } catch (error) {
    log.error('error occurred：', error);
    return;
  } 
}
