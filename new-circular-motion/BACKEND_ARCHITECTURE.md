# 高中物理圆周运动平台 - 后端架构设计

## 🎯 核心功能需求

### 1. 学生端数据提交
- ✅ 选择题答案（自动评分）
- ✅ 数值输入题（自动评分）
- 🔄 附件上传（实验报告、图片等）
- ✅ 开放题答案（文本输入）

### 2. 教师端数据分析
- 📈 班级整体成绩统计
- 📊 单题正确率分析
- 🔍 学生个人详细答案查看
- 📁 附件下载与批阅

## 🗄️ 数据模型设计

### 学生成绩表 (student_scores)
```sql
CREATE TABLE student_scores (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(100),
  total_score INTEGER,
  submit_time TIMESTAMP DEFAULT NOW(),
  -- 各题得分详情
  q1_score INTEGER DEFAULT 0,  -- 选择题1
  q2_score INTEGER DEFAULT 0,  -- 选择题2
  q3_score INTEGER DEFAULT 0,  -- 选择题3
  q4_score INTEGER DEFAULT 0,  -- 选择题4
  q5_score INTEGER DEFAULT 0,  -- 选择题5
  q6_score INTEGER DEFAULT 0,  -- 选择题6
  q7_score INTEGER DEFAULT 0,  -- 数值输入题
  q8_score INTEGER DEFAULT 0,  -- 实验题（附件）
  q9_score INTEGER DEFAULT 0   -- 开放题
);
```

### 学生答案详情表 (student_answers)
```sql
CREATE TABLE student_answers (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  q1_answer VARCHAR(10),      -- 选择题1答案
  q2_answer VARCHAR(10),      -- 选择题2答案
  q3_answer VARCHAR(10),      -- 选择题3答案
  q4_answer VARCHAR(10),      -- 选择题4答案
  q5_answer VARCHAR(10),      -- 选择题5答案
  q6_answer VARCHAR(10),      -- 选择题6答案
  q7_answer VARCHAR(50),      -- 数值输入题答案
  q8_file_urls TEXT[],        -- 实验题附件URL数组
  q9_answer TEXT,              -- 开放题文本答案
  submit_time TIMESTAMP DEFAULT NOW()
);
```

### 班级统计表 (class_statistics)
```sql
CREATE TABLE class_statistics (
  id SERIAL PRIMARY KEY,
  class_id VARCHAR(50),
  total_students INTEGER,
  avg_score DECIMAL(5,2),
  submit_rate DECIMAL(5,2),
  -- 各题正确率
  q1_correct_rate DECIMAL(5,2),
  q2_correct_rate DECIMAL(5,2),
  q3_correct_rate DECIMAL(5,2),
  q4_correct_rate DECIMAL(5,2),
  q5_correct_rate DECIMAL(5,2),
  q6_correct_rate DECIMAL(5,2),
  q7_correct_rate DECIMAL(5,2),
  update_time TIMESTAMP DEFAULT NOW()
);
```

## 📁 文件上传解决方案

### 方案一：使用Supabase Storage（推荐）
```typescript
// 文件上传服务
const uploadFile = async (file: File, studentId: string, questionId: string) => {
  const fileName = `${studentId}_${questionId}_${Date.now()}.${file.name.split('.').pop()}`;
  const { data, error } = await supabase.storage
    .from('student-reports')
    .upload(fileName, file);
  
  if (error) throw error;
  return data.path;
};
```

### 方案二：使用第三方云存储
- AWS S3
- 阿里云OSS
- 腾讯云COS

## 🔧 技术栈建议

### 前端（已完成）
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS
- ✅ Zustand状态管理

### 后端（新增）
- 🔄 Supabase（数据库 + 存储 + 认证）
- 🔄 Express.js API（数据处理逻辑）
- 🔄 文件上传服务

### 部署平台
- ✅ Vercel（前端）
- 🔄 Supabase（后端服务）
- 🔄 文件存储服务

## 📋 实施步骤

### 第一阶段：基础数据存储
1. 设置Supabase项目
2. 创建数据库表结构
3. 实现基础API接口
4. 学生答案提交功能

### 第二阶段：文件上传
1. 配置文件存储服务
2. 实现文件上传API
3. 学生端附件上传功能
4. 教师端文件下载功能

### 第三阶段：数据分析
1. 自动评分算法
2. 班级统计功能
3. 数据可视化图表
4. 导出报告功能

## 🎯 下一步行动

您希望我现在开始实现哪个阶段？我可以：

1. **立即开始**：设置Supabase后端服务
2. **先部署前端**：完成当前Vercel部署
3. **详细设计**：深入某个具体功能的实现方案

请告诉我您的优先级选择！