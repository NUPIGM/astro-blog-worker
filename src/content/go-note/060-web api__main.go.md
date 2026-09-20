# Go Note 源码教学：`web api/main.go`

## 1. 学习目标

本篇针对仓库中的 `web api/main.go`，从实际源码出发学习它的**职责、执行流程、Go 语法、依赖关系、错误处理和可复用经验**。

## 2. 完整源码

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt"
	_ "github.com/mattn/go-sqlite3"
)

// 连接数据库
var db = InitDB()

// 处理 Token 刷新请求
func refreshTokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// 解析 JWT
	token, err := ParseJWT(req.Token)
	if err != nil || !token.Valid {
		http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
		return
	}

	// 获取 JWT 的声明
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["username"] == nil {
		http.Error(w, "Invalid token claims", http.StatusUnauthorized)
		return
	}

	username := claims["username"].(string)
	_, role, _ := GetUser(db, username)

	// 生成新的 JWT
	newToken, err := GenerateJWT(username, role)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"token": newToken})
}

// 用户注册
func registerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// 默认角色为 "user"，仅允许 "admin" 或 "user"
	if req.Role != "admin" {
		req.Role = "user"
	}
	hashpwd, _ := HashPassword(req.Password)
	// 插入数据库
	_, err := db.Exec("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", req.Username, hashpwd, req.Role)
	if err != nil {
		http.Error(w, "Username already exists", http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// 用户登录
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST is allowed", http.StatusMethodNotAllowed)
		return
	}

	var credentials struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// 查询用户
	storedPassword, role, err := GetUser(db, credentials.Username)
	if err != nil || !checkPassword(storedPassword, credentials.Password) {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	// 生成 JWT，包含角色信息
	token, err := GenerateJWT(credentials.Username, role)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

// 受保护路由（必须携带 JWT）
func protectedHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "You have accessed a protected route!"})
}
func main() {
	InitDB()

	mux := http.NewServeMux()
	// 绑定路由
	mux.HandleFunc("/api/get", GetHandler)
	mux.HandleFunc("/api/post", PostHandler)
	mux.HandleFunc("/api/login", loginHandler) // 用户登录
	mux.HandleFunc("/api/register", registerHandler)
	mux.Handle("/api/protected", JwtMiddleware(http.HandlerFunc(protectedHandler))) // 受保护路由
	mux.HandleFunc("/api/refresh-token", refreshTokenHandler)                       // 刷新 Token

	// 使用 CORS 中间件包装 Mux
	handler := CorsMiddleware(mux)

	// 启动服务器
	fmt.Println("Server is running on port 8080...")
	err := http.ListenAndServe(":8080", handler)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}

// [INFO]
/*
JWT 本身是 无状态的，不存储在服务器端，因此无法像 session 一样直接销毁。
常见的 JWT 失效方案：

黑名单（将已登出的 Token 存储，并检查是否无效）
Token 旋转（每次刷新 Token 都会让旧 Token 失效）
短生命周期 + 频繁刷新（不登出，Token 短时间内自动失效）
*/
```

## 3. 文件定位

- Package：`main`
- 路径：`web api/main.go`
- 代码行数：160
- 源码中识别到的重点：错误处理, HTTP, JSON, 数据库, 指针, 结构体, 切片/Map

## 4. 依赖分析

- `encoding/json`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `fmt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `net/http`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `github.com/golang-jwt/jwt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `github.com/mattn/go-sqlite3`：本文件实际导入的依赖，需要结合后续调用判断具体用途。

## 5. 函数级教学

### 5.1 `refreshTokenHandler`（第 16 行）

函数声明：

```go
func refreshTokenHandler(w http.ResponseWriter, r *http.Request) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.2 `registerHandler`（第 58 行）

函数声明：

```go
func registerHandler(w http.ResponseWriter, r *http.Request) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.3 `loginHandler`（第 91 行）

函数声明：

```go
func loginHandler(w http.ResponseWriter, r *http.Request) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.4 `protectedHandler`（第 125 行）

函数声明：

```go
func protectedHandler(w http.ResponseWriter, r *http.Request) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.5 `main`（第 129 行）

函数声明：

```go
func main() {
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

### HTTP

源码实际涉及 `HTTP`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### JSON

源码实际涉及 `JSON`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 数据库

源码实际涉及 `数据库`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

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
