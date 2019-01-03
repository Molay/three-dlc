const fs = require('fs');
const path = require('path');
const glob = require('glob');
const rimraf = require('rimraf');
const three = require('three');

// copy three.js/example/js to tmp manually
const threeExampleJsPath = path.resolve(__dirname, '../tmp');
const writePath = path.resolve(__dirname, '../src');
const indexMarkdownPath = path.resolve(__dirname, '../INDEX.md');
const undoneMarkdownPath = path.resolve(__dirname, 'UNDONE.md');

const regExp01 = /\bTHREE\.(\w+?)\b/g;
const regExp02 = /\bTHREE\./g;
const nonClassMap = {};
const dirScope = {};
const writeFlag = true;

/**
 * 预处理脚本，自动将 three.js/example/js 下的资源进行转换，并转存至当前工程中。
 * TODO 目前采用字符串识别和替换的方式实现，后续可使用 @babel/parser 进行语法分析，准确性会更高。
 * 无法自动转换的文件将在 INDEX.md 中以未完成形式罗列，并在 build/UNDONE.md 中列出，可供后续进行人工干预处理。
 * 预处理结束后，请执行 yarn build 看哪些无法编译通过，并进行修改和调整。
 * @author Molay Chen
 */
glob('**/*.js', {
  cwd: threeExampleJsPath,
  dot: false,
  ignore: [
    'libs/**',
    'crossfade/**',
    'nodes/**',
    'utils/ldraw/**'
  ]
}, function (err, files) {

  const dlcScope = {};
  files.forEach(file => {
    const {name, dir} = path.parse(file);
    dlcScope[name] = file;
    // 保存目录下的文件信息
    if (!dirScope[dir]) dirScope[dir] = {};
    dirScope[dir][name] = `${dir ? dir + '/' : ''}${name}`;
  });

  let numReadFiles = 0;
  const onFileRead = function () {
    numReadFiles++;
    if (numReadFiles === files.length) {

      const dirs = Object.keys(dirScope).sort();

      // 更新 index.js
      {
        const indexJsMap = {};
        dirs.forEach(dir => {
          if (!indexJsMap[dir]) indexJsMap[dir] = {
            fileMap: dirScope[dir],
            childMap: {}
          };
        });
        dirs.forEach(dir => {
          if (!dir) return;
          let parent = path.join(dir, '..');
          if (parent === '.') parent = '';
          parent = indexJsMap[parent];
          parent.childMap[path.basename(dir)] = 1;
        });

        Object.keys(indexJsMap).sort().forEach(dir => {
          const {fileMap, childMap} = indexJsMap[dir];
          const files = Object.keys(fileMap);
          const children = Object.keys(childMap);

          const exportFromFiles = files.map(file => `export ${file} from './${file}';`).join('\n');
          const exportFromChildren = children.map(child => `export * from './${child}';`).join('\n');
          const content = [];
          if (exportFromFiles.length > 0) content.push(exportFromFiles);
          if (exportFromChildren.length > 0) content.push(exportFromChildren);
          if (content.length > 0) content.push('');

          fs.writeFileSync(path.resolve(writePath, dir, 'index.js'), content.join('\n'));
        });
      }

      // 将转换结果写入 INDEX.md 中，并标记未完成的项目
      {
        const sections = ['# INDEX'];
        dirs.forEach(dir => {
          const items = Object.keys(dirScope[dir]).sort().map(className => {
            const flag = nonClassMap[className] ? '[ ]' : '[x]';
            const filePath = `./src${dir ? '/' + dir : ''}/${className}.js`;
            return `- ${flag} [${className}](${filePath} "${className}")`;
          }).join('\n');
          const section = `## /${dir}
${items}
`;
          sections.push(section);
        });
        fs.writeFileSync(indexMarkdownPath, sections.join('\n'));
      }

      // 将未完成项目写入 UNDONE.md 中
      {
        const sections = [];
        sections.push('# UNDONE');
        sections.push(`- ${Object.values(nonClassMap).sort().join('\n- ')}`);
        fs.writeFileSync(undoneMarkdownPath, sections.join('\n'));
      }
    }
  };

  rimraf.sync(writePath + '/*');

  files.forEach(file => {
    const filePath = path.resolve(threeExampleJsPath, file);
    const {name, dir} = path.parse(file);
    const fileScope = {};
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) throw err;
      regExp01.lastIndex = -1;
      let match;
      while ((match = regExp01.exec(data))) {
        const className = match[1];
        if (!fileScope[className]) fileScope[className] = 0;
        fileScope[className]++;
      }

      // 默认视文件名(不含后缀)为类名，
      // 如果文件内容里没有"THREE.类名"，则说明文件内容为函数或对象，需要后续特殊处理
      let nonClassFlag = false;
      if (!fileScope[name]) {
        nonClassMap[name] = file;
        nonClassFlag = true;

        // // TODO 目前没有做处理，直接拷贝文件，等待人工干预
        // if (writeFlag) {
        //   const writeFilePath = path.resolve(writePath, file);
        //   fs.mkdirSync(path.dirname(writeFilePath), {recursive: true});
        //   fs.writeFileSync(writeFilePath, data);
        // }
        //
        // onFileRead();
        // return;
      }

      // 调整内容存为新文件
      const importFromThree = [];
      const importFromDlc = [];
      Object.keys(fileScope).sort().forEach(className => {
        // if (className === name) return;
        if (three.hasOwnProperty(className) && className !== name) importFromThree.push(className);
        else if (dlcScope[className] && className !== name) importFromDlc.push(className);
      });

      // replace main entry
      if (!nonClassFlag) {
        data = data.replace(
          new RegExp(`THREE.${name}[\\s]*?=([^=])`, 'm'),
          `const ${name} =$1`
        );
      }
      // remove all "THREE." string
      data = data.replace(regExp02, '');

      const lines = [];
      if (importFromThree.length > 0) {
        let line = `import { ${importFromThree.join(', ')} } from 'three';`;
        // hard wrap
        if (line.length >= 120) {
          line = `import {
  ${importFromThree.join(',\n  ')}
} from 'three';`;
        }
        lines.push(line);
      }
      if (importFromDlc.length > 0) {
        lines.push(importFromDlc.map(className => {
          const file2 = dlcScope[className];
          const {dir: dir2, name: name2} = path.parse(file2);
          let d = dir2;
          if (!dir) d = './' + dir2;
          else if (dir === dir2) d = '.';
          else {
            d = path.join(dir.split('/').map(() => '..').join('/'), dir2);
          }
          return `import ${className} from '${d}/${className}';`;
        }).join('\n'));
      }
      if (lines.length > 0) lines.push('');
      lines.push(
        data,
        '',
        `export default ${name};`,
        ''
      );

      if (writeFlag) {
        const writeFilePath = path.resolve(writePath, file);
        fs.mkdirSync(path.dirname(writeFilePath), {recursive: true});
        fs.writeFileSync(writeFilePath, lines.join('\n'));
      }

      onFileRead();
    });
  });
});
