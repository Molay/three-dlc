# three.js dlc

The three.js expansion library with official example modules.   

three.js 扩展，包含 three.js 官方 example 中的部分功能模块。   

All modules are implemented using standard ES6 syntax (Drudgery~😂).   

所有模块均采用标准 ES6 语法实现（苦力活😂）。   

Contact:   

* Molay Chen <molayc@gmail.com> https://github.com/molay

```javascript
// Recommended usage: Use on demand.
// 推荐用法：按需使用。
import OrbitControls from 'three-dlc/src/controls/OrbitControls';

// OR
// 或

// Not recommended usage: It will increase the size.
// 非推荐用法：会造成文件体积变大。
import {OrbitControls} from 'three-dlc';

const orbitControls = new OrbitControls(object, domElement);
```

## content index 内容索引
[Content Index](./INDEX.md "Content Index")

## ignored files 忽略的文件
* libs/*
* crossfade/*
* nodes/*
