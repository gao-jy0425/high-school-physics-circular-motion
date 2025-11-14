import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ChoiceQuestion {
  id: number;
  type: 'choice';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

interface CalculationQuestion {
  id: number;
  type: 'calculation';
  question: string;
  correctAnswer: number;
  unit: string;
  explanation: string;
  category: string;
  tolerance?: number; // 答案容差
}

interface OpenQuestion {
  id: number;
  type: 'open';
  question: string;
  explanation: string;
  category: string;
}

type Question = ChoiceQuestion | CalculationQuestion | OpenQuestion;

// 题目数据
const questions: Question[] = [
  // 选择题 1: 临界问题
  {
    id: 1,
    type: 'choice',
    question: '一个质量为2kg的小球，用一根最大承受拉力为50N的绳子在水平面内做匀速圆周运动，半径为1m。当角速度达到多少时绳子会断裂？',
    options: [
      'A. 3 rad/s',
      'B. 4 rad/s', 
      'C. 5 rad/s',
      'D. 6 rad/s'
    ],
    correctAnswer: 2, // C
    explanation: '向心力公式 F = mω²r，当F = 50N时：50 = 2 × ω² × 1，解得 ω = √25 = 5 rad/s',
    category: '临界问题'
  },
  
  // 选择题 2: 公式记忆
  {
    id: 2,
    type: 'choice',
    question: '在匀速圆周运动中，线速度v、角速度ω和半径r之间的关系是？',
    options: [
      'A. v = ω/r',
      'B. v = ωr',
      'C. v = ω²r',
      'D. v = r/ω'
    ],
    correctAnswer: 1, // B
    explanation: '线速度v = ωr，这是圆周运动的基本关系式，表示单位时间内通过的弧长。',
    category: '公式记忆'
  },
  
  // 选择题 3: 结合实际
  {
    id: 3,
    type: 'choice',
    question: '汽车转弯时，如果速度过快，车辆会向外侧滑。这是因为在转弯过程中，什么力不足以提供所需的向心力？',
    options: [
      'A. 重力',
      'B. 支持力',
      'C. 摩擦力',
      'D. 空气阻力'
    ],
    correctAnswer: 2, // C
    explanation: '汽车转弯时的向心力由轮胎与地面间的摩擦力提供。当速度过快时，最大静摩擦力不足以提供所需的向心力，车辆就会向外侧滑。',
    category: '结合实际'
  },
  
  // 计算题 1: 临界问题
  {
    id: 4,
    type: 'calculation',
    question: '一个质量为0.5kg的小球，用长0.8m的轻绳系着，在光滑水平面上做匀速圆周运动。已知绳子能承受的最大拉力为20N，求小球的最大线速度是多少？（忽略空气阻力）',
    correctAnswer: 5.66,
    unit: 'm/s',
    explanation: '向心力由绳子拉力提供：F = mv²/r，20 = 0.5 × v² / 0.8，解得 v = √(20 × 0.8 / 0.5) = √32 ≈ 5.66 m/s',
    category: '临界问题',
    tolerance: 0.1
  },
  
  // 计算题 2: 公式应用
  {
    id: 5,
    type: 'calculation',
    question: '地球绕太阳公转的轨道可以近似看作圆周，轨道半径约为1.5×10¹¹m，公转周期约为365天。求地球绕太阳公转的角速度。（结果保留2位小数）',
    correctAnswer: 1.99e-7,
    unit: 'rad/s',
    explanation: '角速度 ω = 2π/T，T = 365×24×3600 = 31536000s，ω = 2π/31536000 ≈ 1.99×10⁻⁷ rad/s',
    category: '公式应用',
    tolerance: 0.05e-7
  },
  
  // 计算题 3: 综合应用
  {
    id: 6,
    type: 'calculation',
    question: '一辆质量为1000kg的汽车以72km/h的速度通过半径为50m的圆形拱桥顶部。求此时汽车对桥的压力。（g取10m/s²）',
    correctAnswer: 8000,
    unit: 'N',
    explanation: 'v = 72km/h = 20m/s，向心力由重力和支持力的合力提供：mg - N = mv²/r，N = mg - mv²/r = 1000×10 - 1000×20²/50 = 10000 - 8000 = 2000N',
    category: '综合应用',
    tolerance: 100
  },
  
  // 开放题: 启发思考
  {
    id: 7,
    type: 'open',
    question: '如果考虑摩擦力、考虑非水平面的情况下，圆周运动会变成什么样？请结合实际情况分析，可以讨论汽车转弯、过山车、自行车骑行等例子。',
    explanation: '这个问题鼓励你思考理想模型与实际情况的差异。考虑摩擦力时，运动会逐渐减速；考虑斜面时，重力的分力会影响向心力；考虑空气阻力时，需要持续提供能量维持运动。',
    category: '启发思考'
  }
];

const QuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [showResults, setShowResults] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File[]>>({});

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleChoiceAnswer = (questionId: number, choiceIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: choiceIndex }));
  };

  const handleCalculationAnswer = (questionId: number, value: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleOpenAnswer = (questionId: number, value: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFileUpload = (questionId: number, files: FileList | null) => {
    if (files) {
      setUploadedFiles(prev => ({ 
        ...prev, 
        [questionId]: Array.from(files) 
      }));
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(question => {
      if (question.type === 'choice') {
        const userAnswer = userAnswers[question.id];
        if (userAnswer === question.correctAnswer) {
          correct++;
        }
      } else if (question.type === 'calculation') {
        const userAnswer = parseFloat(userAnswers[question.id]);
        const correctAnswer = question.correctAnswer;
        const tolerance = question.tolerance || 0.1;
        if (Math.abs(userAnswer - correctAnswer) <= tolerance) {
          correct++;
        }
      }
    });
    return correct;
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'choice':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 px-3 py-1 rounded-full inline-block">
              <span className="text-blue-700 text-sm font-medium">{question.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{question.question}</h3>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={index}
                    checked={userAnswers[question.id] === index}
                    onChange={() => handleChoiceAnswer(question.id, index)}
                    className="mr-3 text-blue-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'calculation':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 px-3 py-1 rounded-full inline-block">
              <span className="text-green-700 text-sm font-medium">{question.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{question.question}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最终答案（单位：{question.unit}）
                </label>
                <input
                  type="number"
                  step="any"
                  value={userAnswers[question.id] || ''}
                  onChange={(e) => handleCalculationAnswer(question.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入数值答案"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传解题过程（可选）
                </label>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(question.id, e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedFiles[question.id] && (
                  <div className="mt-2 text-sm text-gray-600">
                    已上传 {uploadedFiles[question.id].length} 个文件
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'open':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 px-3 py-1 rounded-full inline-block">
              <span className="text-purple-700 text-sm font-medium">{question.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{question.question}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  你的思考与分析
                </label>
                <textarea
                  value={userAnswers[question.id] || ''}
                  onChange={(e) => handleOpenAnswer(question.id, e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请详细阐述你的观点和分析过程..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传相关资料或图示（可选）
                </label>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(question.id, e.target.files)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {uploadedFiles[question.id] && (
                  <div className="mt-2 text-sm text-gray-600">
                    已上传 {uploadedFiles[question.id].length} 个文件
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showResults) {
    const score = calculateScore();
    const totalChoiceAndCalc = questions.filter(q => q.type === 'choice' || q.type === 'calculation').length;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">{score}/{totalChoiceAndCalc}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">测试完成！</h2>
              <p className="text-gray-600">你在客观题部分答对了 {score} 道题</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">学习建议</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 熟练掌握向心力公式 F = mω²r = mv²/r</li>
                  <li>• 理解线速度、角速度、周期之间的关系</li>
                  <li>• 多结合实际例子理解物理概念</li>
                  <li>• 注意临界条件的分析</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                  setUploadedFiles({});
                }}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                重新测试
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                返回主页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 进度条 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-800">圆周运动习题自测</h1>
            <span className="text-sm text-gray-600">
              第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderQuestion(currentQuestion)}
          
          {/* 导航按钮 */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentQuestionIndex === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              上一题
            </button>
            
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                返回主页
              </button>
              <button
                onClick={nextQuestion}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {currentQuestionIndex === questions.length - 1 ? '完成测试' : '下一题'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage;