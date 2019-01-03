# three.js dlc
The three.js expansion library with official example js modules.   
three.js 扩展，包含 three.js 官方 example 中的部分 js 功能模块。   

The problems in the three.js official example/js codes:
1. The example codes do not use a standard import/export statement and cannot be applied directly 
   to the ES6 project.
2. The example codes follow the scope "THREE" used by the three.js engine and do not conform to 
   the ES6 specification. In some cases, using the example code will cause the compilation to fail;   
   If the scope "THREE" is used in the reusable library based on these example codes, and besides, 
   the version of three.js used in the actual project does not match, the confused scope "THREE" 
   will cause problems.

three.js 官方 example/js 示例代码存在的问题：
1. 示例代码未采用标准的 import/export 声明，无法直接应用于 ES6 项目。
2. 示例代码沿用 three.js 引擎所使用的作用域 THREE，不符合 ES6 规范，在部分场合下使用这些示例代码会造成编译失败；   
   同时如果在可复用类库中使用 THREE 作用域，若实际应用的项目中使用的 three.js 版本与之不匹配，
   会造成因作用域混乱而产生的找不到示例代码对象的问题。

This project is based on the three.js official example/js codes, all modules are unbound from scope "THREE", 
and exported by using standard ES6 syntax (Drudgery~ 😂).   
本项目基于 three.js 官方 example/js 示例代码，将绝大部分模块从 THREE 作用域中解除绑定，并采用标准 ES6 语法将
其导出（苦力活 😂）。

Contact / 联系我们 :   
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
并且添加 "import/export" 声明，然后将预处理后的文件存储至 three-dlc/src 文件夹中。   
   所有不能被自动化处理的文件将被标记在 three-dlc/CONTENT_INDEX.md 以及 three-dlc/build/UNDONE.md 文件中。
3. 需要手工测试、验证并修复不正确的文件 😂，执行 "yarn build" 与 "yarn test" 显示导出的内容。
