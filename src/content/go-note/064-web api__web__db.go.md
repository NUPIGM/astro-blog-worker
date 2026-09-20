# Go Note 源码教学：`web api/web/db.go`

## 1. 学习目标

本篇针对仓库中的 `web api/web/db.go`，从实际源码出发学习它的**职责、执行流程、Go 语法、依赖关系、错误处理和可复用经验**。

## 2. 完整源码

```go
package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	db := db{
		dsn: "root14:nH5QmLpwRKK8Jc6q@tcp(mysql2.sqlpub.com:3307)/root01",
	}
	db.init()
	db.creatTable()

}

type db struct {
	dsn string
}

func (mysql db) init() (basedata sql.DB) {
	// 连接 MySQL 数据库
	db, err := sql.Open("mysql", mysql.dsn)
	if err != nil {
		log.Fatal("数据库连接失败:", err)
	}
	db.SetMaxOpenConns(25)                 // 设置最大打开的连接数
	db.SetMaxIdleConns(10)                 // 设置最大空闲连接数
	db.SetConnMaxLifetime(5 * time.Minute) // 设置连接的最大生命周期

	// 测试连接
	err = db.Ping()
	if err != nil {
		log.Fatal("数据库不可用:", err)
	}
	fmt.Println("成功连接 MySQL 数据库！")
	return
}
func (mysql db) creatTable() {
	db, _ := sql.Open("mysql", mysql.dsn)
	// 创建表的 SQL 语句
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		age INT NOT NULL,
		email VARCHAR(255) UNIQUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	// 执行 SQL 语句

	_, err := db.Exec(createTableSQL)
	if err != nil {
		log.Fatal("创建表失败:", err)
	}

	fmt.Println("成功创建 users 表！")
}
func postDB(db *sql.DB, table string) {
	result, err := db.Exec("INSERT INTO ? (name, age) VALUES (?, ?)", table, "Alice", 30)
	if err != nil {
		log.Fatal("插入失败:", err)
	}
	id, _ := result.LastInsertId()
	fmt.Println("新插入的 ID:", id)

}
func updateDB(db *sql.DB) {
	_, err := db.Exec("UPDATE users SET age = ? WHERE name = ?", 35, "Alice")
	if err != nil {
		log.Fatal("更新失败:", err)
	}

}
func deleteDB(db *sql.DB) {
	_, err := db.Exec("DELETE FROM users WHERE name = ?", "Alice")
	if err != nil {
		log.Fatal("删除失败:", err)
	}

}
func getDB(db *sql.DB) {
	var name string
	err := db.QueryRow("SELECT name FROM users WHERE id = ?", 1).Scan(&name)
	if err != nil {
		log.Fatal("查询失败:", err)
	}
	fmt.Println("用户名称:", name)

	rows, err := db.Query("SELECT id, name FROM users")
	if err != nil {
		log.Fatal("查询失败:", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("ID: %d, Name: %s\n", id, name)
	}

}
```

## 3. 文件定位

- Package：`main`
- 路径：`web api/web/db.go`
- 代码行数：110
- 源码中识别到的重点：错误处理, 并发, 文件, 数据库, 指针, 结构体

## 4. 依赖分析

- `database/sql`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `fmt`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `log`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `time`：本文件实际导入的依赖，需要结合后续调用判断具体用途。
- `github.com/go-sql-driver/mysql`：本文件实际导入的依赖，需要结合后续调用判断具体用途。

## 5. 函数级教学

### 5.1 `main`（第 12 行）

函数声明：

```go
func main() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.2 `init`（第 25 行）

函数声明：

```go
func (mysql db) init() (basedata sql.DB) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.3 `creatTable`（第 43 行）

函数声明：

```go
func (mysql db) creatTable() {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.4 `postDB`（第 64 行）

函数声明：

```go
func postDB(db *sql.DB, table string) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.5 `updateDB`（第 73 行）

函数声明：

```go
func updateDB(db *sql.DB) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.6 `deleteDB`（第 80 行）

函数声明：

```go
func deleteDB(db *sql.DB) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

### 5.7 `getDB`（第 87 行）

函数声明：

```go
func getDB(db *sql.DB) {
```

**怎么读：**

1. 先确定参数和返回值，建立函数的输入/输出契约。
2. 从函数体第一行开始追踪数据如何变化。
3. 对每次函数调用继续追踪被调用函数。
4. 检查错误返回、资源释放、状态修改和最终返回。

## 6. 类型与数据结构

- 第 1 行：`type db struct {`

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

### 并发

源码实际涉及 `并发`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 文件

源码实际涉及 `文件`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

### 数据库

源码实际涉及 `数据库`。学习时重点关注它在本文件中的真实用法，而不是只记语法。

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
