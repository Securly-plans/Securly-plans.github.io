var fs = require('fs');
var path = require('path');

var staticResourceDir = '/data/';
var ignoreFiles = ['.DS_Store', 'license.txt', 'LICENSE.txt'];
var resourcesPath = './src/static/data/';
var resourcesFile = './src/client/resources.js';

var melontypes = {
  image: ['png', 'jpg', 'jpeg'],
  binary: ['fnt', 'ltr', 'ttf'],
  tmx: ['tmx'],
  audio: ['mp3', 'ogg']
};

/*
  Why MelonJS?
    why format audio differently?
*/
var handleAudio = function(file, dir) {
  file['type'] = 'audio';
  file['src'] = staticResourceDir + dir.replace(resourcesPath, '');
  var name = file['name'].split('/').pop();
  file['name'] = name;
  return file;
};

var walkSync = function(dir, filelist) {
  var fs = fs || require('fs'),
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + file + '/', filelist);
    } else {
      if (ignoreFiles.indexOf(file) < 0) {
        var fileName = file;
        var src = dir.replace(resourcesPath, '') + file;
        var file = {};
        var fragments = fileName.split('.');
        file['name'] = fragments[0];
        file['src'] = staticResourceDir + src;
        Object.keys(melontypes).some(function(type) {
          if (melontypes[type].indexOf(fragments[1]) >= 0 && type != 'audio') {
            file['type'] = type;
            return true;
          }
          if (melontypes[type].indexOf(fragments[1]) >= 0 && type === 'audio') {
            file = handleAudio(file, dir);
            return true;
          }
          return false;
        });
        filelist.push(file);
      }
    }
  });
  return filelist;
};

var data = walkSync(resourcesPath);
var file = fs.createWriteStream(resourcesFile);
console.log("Exporting resources to: " + resourcesFile);
console.log(data);
file.write('export default ' + JSON.stringify(data, null, '  ') + ";\n");
file.end();