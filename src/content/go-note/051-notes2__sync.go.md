# Go Note 源码教学：`notes2/sync.go`

## 1. 学习目标

本篇针对仓库中的 `notes2/sync.go`，从实际源码出发学习它的**职责、执行流程、Go 语法、依赖关系、错误处理和可复用经验**。

## 2. 完整源码

```go
package notes2

import (
	"fmt"
	"sync"
	"time"
)

func Sync() {
	//只能运行一次
	o := &sync.Once{}

	o.Do(func() {
		fmt.Println("只执行一次")
	})
	o.Do(func() {
		fmt.Println("hello")
	})

	//map类型
	m := &sync.Map{}
	m.Store(1, "map1")
	m.Store(2, 2)
	m.Store(3, 3)
	m.Load(1) //获取值
	//无顺序
	m.Range(func(key, value any) bool {
		fmt.Println("map:", key, value)
		return true
	})

	// 并发池
	var pool = &sync.Pool{
		New: func() any {
			fmt.Println("新建对象")
			return new([]byte) // 这里创建的是 []byte 指针
		},
	}
	//pool，主要作用减少GCC内存回收
	// 从 Pool 获取对象
	obj1 := pool.Get().(*[]byte)
	fmt.Println("获取对象:", obj1)

	// 归还对象到 Pool
	// pool.get()没有指针，地址不一样
	pool.Put(obj1)

	// 再次获取对象（应该是之前归还的）
	obj2 := pool.Get().(*[]byte)
	fmt.Println("复用对象:", obj2)
}

func Waitting() {
	var wg sync.WaitGroup
	for i := 2; i < 100001; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 2; j < i; j++ {
				if i%j == 0 {
					return
				}
			}
			fmt.Println(i)

		}()
	}
	wg.Wait()
}

// 协程锁与释放
func Cond() {
	var mu sync.Mutex
	cond := sync.NewCond(&mu)
	for i := 0; i < 15; i++ {
		go func() {
			cond.L.Lock()
			cond.Wait()
			fmt.Println(".")
			cond.L.Unlock()
		}()

	}
	for i := 0; i < 10; i++ {
		time.Sleep(time.Millisecond * 200)
		if i == 4 {
			cond.Signal() //单个协程
		}
		if i == 9 {
			cond.Broadcast() //全部协程
		}
	}
}
func Once() {
	var once sync.Once
	var wg sync.WaitGroup
	for range 10 {
		wg.Add(1)
		go func() {
			fmt.Println("*")
			once.Do(func() {
				fmt.Println("只被打印一次")
			})
			defer wg.Done()
		}()
	}
	wg.Wait()
}
func Map() {
	var m sync.Map
	m.Store(1, "a")
	m.Store(2, "b")
	m.Store(3, "c")
	m.Range(func(key, value any) bool {
		fmt.Println(key, value)
		return true
	})
}

// 锁
func RWMux() {

	var wg sync.WaitGroup
	wg.Add(10)
	// 读锁
	// l := &sync.Mutex{}
	// 读写锁
	l := &sync.RWMutex{}
	go lockFun(l, &wg)
	go lockFun(l, &wg)
	go lockFun(l, &wg)
	go lockFun(l, &wg)
	go lockFun(l, &wg)
	go RLockFunc(l, &wg)
	go RLockFunc(l, &wg)
	go RLockFunc(l, &wg)
	go RLockFunc(l, &wg)
	go RLockFunc(l, &wg)
	wg.Wait()

}

// sync.Mutex
func CountMutex() {
	var c int
	var mu sync.Mutex

	for i := 2; i < 100001; i++ {
		go func() {

			for j := 2; j < i; j++ {
				if i%j == 0 {
					return
				}
			}
			fmt.Printf("%v\t", i)
			mu.Lock()
			c++
			mu.Unlock()

		}()
	}
	time.Sleep(time.Second * 3)

	fmt.Println("总数", c)
}

func lockFun(lock *sync.RWMutex, wg *sync.WaitGroup) {
	// 阻塞
	lock.Lock()
	fmt.Println("attack")
	time.Sleep(time.Second)
	lock.Unlock()
	wg.Done()
}

func RLockFunc(lock *sync.RWMutex, wg *sync.WaitGroup) {
	//不阻塞
	lock.RLock()
	fmt.Println("heath")
	time.Sleep(time.Second)
	wg.Done()
	lock.RUnlock()
}
```

## 3. 文件定位

- Package：`notes2`
- 路径：`notes2/sync.go`
- 代码行数：184
- 源码中识别到的重点：并发, 指针, 切片/Map

## 4. 依赖分析

- `fmt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `sync`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `time`：本文件实际导入的依赖，需要结合后续调用判断具体用途。

## 5. 函数级教学

### 5.1 `Sync`（第 9 行）

函数声明：

```go
func Sync() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.2 `Waitting`（第 53 行）

函数声明：

```go
func Waitting() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.3 `Cond`（第 72 行）

函数声明：

```go
func Cond() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.4 `Once`（第 94 行）

函数声明：

```go
func Once() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.5 `Map`（第 109 行）

函数声明：

```go
func Map() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.6 `RWMux`（第 121 行）

函数声明：

```go
func RWMux() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.7 `CountMutex`（第 144 行）

函数声明：

```go
func CountMutex() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.8 `lockFun`（第 168 行）

函数声明：

```go
func lockFun(lock *sync.RWMutex, wg *sync.WaitGroup) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.9 `RLockFunc`（第 177 行）

函数声明：

```go
func RLockFunc(lock *sync.RWMutex, wg *sync.WaitGroup) {
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
