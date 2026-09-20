# Go Note 源码教学：`web api/util.go`

## 1. 学习目标

本篇针对仓库中的 `web api/util.go`，从实际源码出发学习它的**职责、执行流程、Go 语法、依赖关系、错误处理和可复用经验**。

## 2. 完整源码

```go
package main

import (
	"time"

	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
)

// JWT 密钥
var JwtSecret = []byte("your_secret_key")

// JWT 生成函数
func GenerateJWT(username, role string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"role":     role,
		"exp":      time.Now().Add(time.Hour * 1).Unix(),
	})
	return token.SignedString(JwtSecret)
}

// 解析 JWT 并验证
func ParseJWT(tokenString string) (*jwt.Token, error) {
	return jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return JwtSecret, nil
	})
}

// 生成密码哈希
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// 验证密码
func checkPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
```

## 3. 文件定位

- Package：`main`
- 路径：`web api/util.go`
- 代码行数：40
- 源码中识别到的重点：错误处理, 指针, 接口, 切片/Map

## 4. 依赖分析

- `time`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `github.com/golang-jwt/jwt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `golang.org/x/crypto/bcrypt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。

## 5. 函数级教学

### 5.1 `GenerateJWT`（第 14 行）

函数声明：

```go
func GenerateJWT(username, role string) (string, error) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.2 `ParseJWT`（第 24 行）

函数声明：

```go
func ParseJWT(tokenString string) (*jwt.Token, error) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.3 `HashPassword`（第 31 行）

函数声明：

```go
func HashPassword(password string) (string, error) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.4 `checkPassword`（第 37 行）

函数声明：

```go
func checkPassword(hashedPassword, password string) bool {
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

### 错误处理

源码实际涉及 `错误处理`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 指针

源码实际涉及 `指针`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 接口

源码实际涉及 `接口`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

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
