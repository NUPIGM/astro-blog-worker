# Go Note 源码教学：`notes/struct.go`

## 1. 学习目标

本篇针对仓库中的 `notes/struct.go`，从实际源码出发学习它的**职责、执行流程、Go 语法、依赖关系、错误处理和可复用经验**。

## 2. 完整源码

```go
package notes

import "fmt"

func Struct() {
	// 第一种申明方法
	var qm User
	qm.name = "qimiao"
	qm.age = 19
	qm.hobby = []string{"唱", "跳"}
	fmt.Println(qm)
	// 第二种申明方法,必需填写全部内容
	qm2 := User{"奇淼", 20, []string{"rap"}, Home{"where"}}
	fmt.Println(qm2)
	// 第三种申明方法
	qm3 := User{
		name:  "qm",
		age:   21,
		hobby: []string{"蓝球"},
	}
	fmt.Println(qm3)
	// 返回实例的地址
	qm4 := new(User)
	qm4.name = "qq"
	fmt.Println(qm4, "\n-------------")

	// struct作为参数
	userFunc(qm)

	// 指针修改内容
	var qm5 User
	qmq := &qm5
	qmq.name = "奇怪的奇淼"
	fmt.Println(qmq, "\n------------")

	// 绑定函数
	my := User{
		name: "我自己",
	}
	my.song("惊雷")
	fmt.Println("------------")

	// struct嵌套struct
	var qm6 User
	qm6.Home.addr = "北京"
	fmt.Println(qm6.Home.addr) //结果一样
	fmt.Println(qm6.addr)      //结果一样

}

type Home struct {
	addr string
}
type User struct {
	name  string
	age   int
	hobby []string
	Home
}

func (u User) song(name string) (ret string) {
	ret = "一计惊雷"
	fmt.Println(u.name + "，唱了一首" + name + "，真是" + ret)
	return
}

// struct作为参数
func userFunc(u User) {
	fmt.Println(u.name, "\n-----------")
}
```

## 3. 文件定位

- Package：`notes`
- 路径：`notes/struct.go`
- 代码行数：70
- 源码中识别到的重点：指针, 结构体, 切片/Map

## 4. 依赖分析

本文件没有检测到 import。

## 5. 函数级教学

### 5.1 `Struct`（第 5 行）

函数声明：

```go
func Struct() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.2 `song`（第 61 行）

函数声明：

```go
func (u User) song(name string) (ret string) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.3 `userFunc`（第 68 行）

函数声明：

```go
func userFunc(u User) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

## 6. 类型与数据结构

- 第 1 行：`type Home struct {`
- 第 2 行：`type User struct {`

## 7. 执行流程

阅读源码时按下面顺序建立模型：

```text
调用者 / 程序入口
        ↓
进入当前函数
        ↓
准备输入数据
        ↓
条件判断 / 循环 / 函数调用
        ↓
错误处理与状态变化
        ↓
返回结果 / 产生副作用
```

这只是源码阅读框架；具体路径必须以本文件实际代码为准。

## 8. Go 知识点精讲

### 指针

源码实际涉及 `指针`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 结构体

源码实际涉及 `结构体`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 切片/Map

源码实际涉及 `切片/Map`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

## 9. 常见坑与排查

以下作为源码审查清单，不表示这些问题一定存在于本文件：

- 是否检查了所有可能返回的 `error`？
- 文件、数据库等资源是否正确关闭？
- 指针、map、slice、interface 是否存在 nil 风险？
- 是否存在不必要的 package 耦合？
- 如果使用并发，是否存在共享状态竞争？

## 10. 源码练习

1. 不看源码时，能否说出本文件的主要函数和调用关系？
2. 每个函数的输入、输出是什么？
3. 哪些操作可能失败，错误如何传播？
4. 哪些变量是核心状态？它们在哪里创建和修改？
5. 如果修改一个核心函数，会影响哪些调用者？

## 11. 总结

真正掌握本文件的标准不是能够复述代码，而是能够解释：**为什么这样组织、程序如何执行、数据如何流动、错误如何处理，以及这套写法什么时候值得复用。**
