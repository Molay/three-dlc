const fs = require('fs');
const path = require('path');
const threeDlc = require('../dist/index');

const infos = ['# EXPORT INFO\n'].concat(Object.keys(threeDlc).sort().map(key => {
  const object = threeDlc[key];
  if (typeof object === 'function') {
    return `## Function: ${key}
`;
  } else {
    const childInfos = Object.keys(object).sort().map(childKey => {
      const child = object[childKey];
      if (typeof child === 'function') {
        return `### Function: ${childKey}`;
      } else {
        return `### Object: ${childKey}`;
      }
    });
    return `## Object: ${key}
- ${childInfos.join('\n- ')}
`;
  }
}));

fs.writeFile(path.resolve(__dirname, 'EXPORT_INFO.md'), infos.join('\n'), err => 0);
