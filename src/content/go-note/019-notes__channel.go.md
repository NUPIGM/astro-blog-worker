# Go Note 源码教学：`notes/channel.go`

## 1. 学习目标

本篇针对仓库中的 `notes/channel.go`，从实际源码出发学习它的**职责、执行流程、Go 语法、依赖关系、错误处理和可复用经验**。

## 2. 完整源码

```go
package notes

import (
	"fmt"
	"log"
	"sync"
	"time"
)

// 管道配合协程一起使用
// 计算素数
func Prime() {
	var c int
	var c1 chan int = make(chan int, 100)

	for i := 2; i < 100001; i++ {
		go func() {
			for j := 2; j < i; j++ {
				if i%j == 0 {
					return
				}
			}
			c1 <- i
		}()
	}
done:
	for {
		select {
		case v := <-c1:
			c++
			fmt.Printf("%v\t", v)
		default:
			close(c1)
			break done
		}
	}
	fmt.Println("总数", c)
}

func Chan1() {
	// chanel
	c1 := make(chan int, 5)
	go func() {
		for i := range 10 {
			c1 <- i
		}
	}()
	for range 10 {
		log.Println(<-c1)
	}
}

func Chan2() {
	ch1 := make(chan int, 1)
	ch2 := make(chan int, 1)
	ch3 := make(chan int, 1)
	ch1 <- 1
	ch2 <- 1
	ch3 <- 1
done:
	for {
		select {
		case <-ch1:
			log.Println("c1")
		case <-ch2:
			log.Println("c2")
		case <-ch3:
			log.Println("c3")
		default:
			log.Println("none")
			break done
		}
	}

}

// 可读，可写的chanel
func Chan3() {
	c := make(chan int, 1)
	var readc <-chan int = c
	var writec chan<- int = c
	var wg sync.WaitGroup
	wg.Add(2)
	go set(writec, &wg)
	go get(readc, &wg)
	wg.Wait()
}

func set(writec chan<- int, wg *sync.WaitGroup) {
	for i := range 10 {
		writec <- i
	}
	close(writec)
	wg.Done()
}
func get(readc <-chan int, wg *sync.WaitGroup) {
	for range 10 {
		log.Println(<-readc)
	}
	wg.Done()
}

func TimeChan() {
	var intchan chan int = make(chan int)
	select {
	case <-intchan:
		fmt.Println("收到验证码")
	case <-time.After(time.Second * 2):
		fmt.Println("验证码以过期")
	}
}
```

## 3. 文件定位

- Package：`notes`
- 路径：`notes/channel.go`
- 代码行数：111
- 源码中识别到的重点：并发, 指针

## 4. 依赖分析

- `fmt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `log`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `sync`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `time`：本文件实际导入的依赖，需要结合后续调用判断具体用途。

## 5. 函数级教学

### 5.1 `Prime`（第 12 行）

函数声明：

```go
func Prime() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.2 `Chan1`（第 40 行）

函数声明：

```go
func Chan1() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.3 `Chan2`（第 53 行）

函数声明：

```go
func Chan2() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.4 `Chan3`（第 78 行）

函数声明：

```go
func Chan3() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.5 `set`（第 89 行）

函数声明：

```go
func set(writec chan<- int, wg *sync.WaitGroup) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.6 `get`（第 96 行）

函数声明：

```go
func get(readc <-chan int, wg *sync.WaitGroup) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.7 `TimeChan`（第 103 行）

函数声明：

```go
func TimeChan() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

## 6. 类型与数据结构

未检测到显式 `type` 声明。

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

### 并发

源码实际涉及 `并发`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 指针

源码实际涉及 `指针`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

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
