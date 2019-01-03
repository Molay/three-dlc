# three.js dlc

The three.js expansion library with official example js modules.   
three.js 扩展，包含 three.js 官方 example 中的部分 js 功能模块。   

All modules are exported by using standard ES6 syntax (Drudgery~ 😂).   
所有模块均采用标准 ES6 语法导出（苦力活 😂）。   

Contact:   
* Molay Chen <molayc@gmail.com> https://github.com/molay

## installation 安装

```bash
yarn add three-dlc
```

OR

```bash
npm install three-dlc
```

## usage 使用方法

Recommended usage: Use on demand.   
推荐用法：按需使用。   

```javascript
import OrbitControls from 'three-dlc/src/controls/OrbitControls';

const orbitControls = new OrbitControls(object, domElement);
```

Not recommended usage: It will increase the size.   
非推荐用法：会造成文件体积变大。   

```javascript
import {OrbitControls} from 'three-dlc';

const orbitControls = new OrbitControls(object, domElement);
```

## content index 内容索引

[Content Index](./CONTENT_INDEX.md "Content Index")

## maintenance 维护

Steps: 
1. Copy all files in the latest three.js/example/js folder to three-dlc/tmp folder.
2. Run "yarn preproccess" to auto preproccess the files in three-dlc/tmp folder, 
it will copy files to three-dlc/src folder after replacing "THREE.X" to "X" and adding "import/export" statement.   
   All undone files will be flagged in three-dlc/CONTENT_INDEX.md and three-dlc/build/UNDONE.md file.
3. Test, verify and modify incorrect files manually 😂, use "yarn build" and "yarn test" to show exported infos.

步骤：
1. 从最新版 three.js/example/js 文件夹中复制全部文件至 three-dlc/tmp 文件夹。
2. 执行 "yarn preproccess" 对 three-dlc/tmp 文件夹下的文件进行自动化预处理，预处理会将 "THREE.X" 转换为 "X"，
并且添加 "import/export" 内容。   
   所有不能被自动化处理的文件将被标记在 three-dlc/CONTENT_INDEX.md 以及 three-dlc/build/UNDONE.md 文件中。
3. 需要手工测试、验证并修复不正确的文件 😂，执行 "yarn build" 与 "yarn test" 显示导出的内容。
