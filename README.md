# FTP deployer plugin for [Hexo](https://hexo.io/)

This plugin can upload your blog via ftp.

## Usage

### Install

```
npm install hexo-deployer-ftpput --save
```

### Configure

Add `host`, `user`, `password` and `path` to deploy in _config.yml.

```
deploy:
  - type: ftpput
    host: host
    user: username
    pass: password
    remote: remote path(defalut: /)
```

This plugin is based on the [promise-ftp](https://github.com/realtymaps/promise-ftp) project to upload files, so you can use the [connect configuration](https://github.com/realtymaps/promise-ftp#user-content-methods) in it. 

