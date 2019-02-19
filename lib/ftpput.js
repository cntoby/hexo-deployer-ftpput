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
    const { host, user, pass, remote, mkdir } = config;
    if(!(host && user && pass)) {
       throw(new Error('host、user、pass为必填项'));
    }
    this.ftpConfig = omit(config, ['type', 'remote']);
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
    const {
      config: {
        public_dir
      }
    } = this.ctx;
    const filePath = path.join(public_dir, '/**/*');
    const fileList = glob.sync(filePath, {
      nodir: true
    }); // get file list
    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      const uploadFilePath = file.split('/').slice(1).join('/');
      const spinner = ora().start();
      spinner.text = `Uploading ${file} ...`;
      // uploading
      try {
          await this.conn.mkdir(`${this.uploadPath}/${uploadFilePath}`, true);
          await this.conn.put(file, `${this.uploadPath}/${uploadFilePath}`);
          spinner.succeed(`Uploading ${file} successed`);
      } catch (error) {
          spinner.fail(`Uploading ${file} failed, reason: ${error}`);
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
