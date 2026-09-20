# Go Note 源码教学：`web api/router.go`

## 1. 学习目标

本篇针对仓库中的 `web api/router.go`，从实际源码出发学习它的**职责、执行流程、Go 语法、依赖关系、错误处理和可复用经验**。

## 2. 完整源码

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// 定义 API 响应数据结构
type Response struct {
	Message string `json:"message"`
	Status  int    `json:"status"`
}

// 简单的 get 请求
func GetHandler(w http.ResponseWriter, r *http.Request) {
	// 创建返回数据
	response := Response{
		Message: "Hello, this is your API response!",
		Status:  200,
	}

	// 将数据转换为 JSON
	jsonData, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "Error generating JSON", http.StatusInternalServerError)
		return
	}

	// 发送 JSON 响应
	w.WriteHeader(http.StatusOK)
	w.Write(jsonData)
}

// 简单的 POST 请求
func PostHandler(w http.ResponseWriter, r *http.Request) {
	// 确保是 POST 请求
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	// 解析 JSON 请求体
	type User struct {
		Username string
		Email    string
	}
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}

	// 创建返回数据
	response := Response{
		Message: fmt.Sprintf("User [%s] with email [%s] registered successfully!", user.Username, user.Email),
		Status:  201,
	}

	// 发送 JSON 响应
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}
```

## 3. 文件定位

- Package：`main`
- 路径：`web api/router.go`
- 代码行数：64
- 源码中识别到的重点：错误处理, HTTP, JSON, 指针, 结构体

## 4. 依赖分析

- `encoding/json`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `fmt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `net/http`：本文件实际导入的依赖，需要结合后续调用判断具体用途。

## 5. 函数级教学

### 5.1 `GetHandler`（第 16 行）

函数声明：

```go
func GetHandler(w http.ResponseWriter, r *http.Request) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.2 `PostHandler`（第 36 行）

函数声明：

```go
func PostHandler(w http.ResponseWriter, r *http.Request) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

## 6. 类型与数据结构

- 第 1 行：`type Response struct {`
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

### 错误处理

源码实际涉及 `错误处理`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### HTTP

源码实际涉及 `HTTP`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### JSON

源码实际涉及 `JSON`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 指针

源码实际涉及 `指针`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 结构体

源码实际涉及 `结构体`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

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
