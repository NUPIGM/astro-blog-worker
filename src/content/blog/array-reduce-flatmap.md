---
title: "array reduce flatmap"
description: "Lorem ipsum dolor sit amet"
pubDate: "2022-07-08"
heroImage: "/blog-placeholder-3.jpg"
tags: ["JavaScript", "flatMap", "reduce", "数组"]
---

# `flatMap` 和 `reduce` 使用方法

这两个方法都可以处理数组。

可以先这样记：

- `flatMap`：先把每个东西变一遍，再把里面的小数组摊平。
- `reduce`：把很多东西一个一个合并，最后得到一个结果。

---

## 一、`flatMap`

### 1. 基本写法

```js
const 数组 = [元素1, 元素2, 元素3];

const 新数组 = 数组.flatMap((元素) => {
  return 处理后的结果;
});
```

`flatMap` 会对数组里的每一项执行一次函数，并把结果合并成一个新数组。

### 2. 普通例子

```js
const numbers = [1, 2, 3];

const result = numbers.flatMap((number) => {
  return [number, number * 10];
});

console.log(result);
// [1, 10, 2, 20, 3, 30]
```

可以把它想成：

1. `1` 变成 `[1, 10]`
2. `2` 变成 `[2, 20]`
3. `3` 变成 `[3, 30]`
4. 最后把它们摊平成一个数组

```js
[1, 10] + [2, 20] + [3, 30];
// [1, 10, 2, 20, 3, 30]
```

### 3. `flatMap` 和 `map` 的区别

```js
const numbers = [1, 2, 3];

const mapResult = numbers.map((number) => {
  return [number, number * 10];
});

console.log(mapResult);
// [[1, 10], [2, 20], [3, 30]]
```

`map` 会保留里面的小数组，所以结果是二维数组。

```js
const flatMapResult = numbers.flatMap((number) => {
  return [number, number * 10];
});

console.log(flatMapResult);
// [1, 10, 2, 20, 3, 30]
```

`flatMap` 会自动把一层小数组摊平。

### 4. 用 `flatMap` 过滤数据

如果返回空数组，这一项就不会出现在结果里：

```js
const numbers = [1, 2, 3, 4];

const evenNumbers = numbers.flatMap((number) => {
  if (number % 2 === 0) {
    return [number];
  }

  return [];
});

console.log(evenNumbers);
// [2, 4]
```

---

## 二、`reduce`

### 1. 基本写法

```js
const 结果 = 数组.reduce((之前的结果, 当前元素) => {
  return 新的结果;
}, 初始值);
```

`reduce` 就像一个小朋友：

1. 先拿一个初始值
2. 从数组中拿出第一个元素
3. 把它们合并
4. 继续拿下一个元素
5. 最后只留下一个结果

### 2. 计算总和

```js
const apples = [1, 1, 1, 1];

const total = apples.reduce((sum, apple) => {
  return sum + apple;
}, 0);

console.log(total);
// 4
```

执行过程：

```text
开始：sum = 0
第 1 个苹果：0 + 1 = 1
第 2 个苹果：1 + 1 = 2
第 3 个苹果：2 + 1 = 3
第 4 个苹果：3 + 1 = 4
最后结果：4
```

这里：

- `sum`：之前已经计算出的总数
- `apple`：当前拿到的数字
- `0`：初始值

### 3. 计算购物车总价

```js
const products = [
  { name: "苹果", price: 3 },
  { name: "香蕉", price: 2 },
  { name: "牛奶", price: 5 },
];

const totalPrice = products.reduce((total, product) => {
  return total + product.price;
}, 0);

console.log(totalPrice);
// 10
```

### 4. 把数组拼成字符串

```js
const words = ["我", "喜欢", "学习", "JavaScript"];

const sentence = words.reduce((result, word) => {
  return result + word;
}, "");

console.log(sentence);
// 我喜欢学习JavaScript
```

### 5. 统计每个水果出现的次数

```js
const fruits = ["苹果", "香蕉", "苹果", "橘子", "香蕉", "苹果"];

const fruitCount = fruits.reduce((count, fruit) => {
  count[fruit] = (count[fruit] || 0) + 1;
  return count;
}, {});

console.log(fruitCount);
// { 苹果: 3, 香蕉: 2, 橘子: 1 }
```

这里的初始值是空对象 `{}`，所以 `reduce` 最后得到的是一个对象。

---

## 三、`flatMap` 和 `reduce` 怎么选择？

| 需求                               | 推荐方法  |
| ---------------------------------- | --------- |
| 对每个元素进行处理，得到一个新数组 | `map`     |
| 对每个元素处理，并把一层小数组摊平 | `flatMap` |
| 计算总和、总价                     | `reduce`  |
| 拼接字符串                         | `reduce`  |
| 统计数量                           | `reduce`  |
| 把数组变成对象                     | `reduce`  |

## 四、一句话记忆

```text
flatMap：变一变，再摊平。
reduce：一个一个合并，最后变成一个结果。
```
