import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const navigate = useNavigate();
  const [showForceAnalysis, setShowForceAnalysis] = useState(false);
  const showForceRef = useRef(showForceAnalysis);

  // 同步状态到ref，让动画函数能访问最新状态
  useEffect(() => {
    showForceRef.current = showForceAnalysis;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    canvas.width = 600;
    canvas.height = 400;

    let angle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 20; // 稍微向下调整圆心位置
    const radius = 70; // 稍微减小半径以适应新的平面
    const angularSpeed = 0.02;

    // 动画循环函数
    const animate = () => {
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 绘制浅灰色背景平面（平行四边形，模拟斜上方视角）
      ctx.fillStyle = '#f0f0f0';
      ctx.beginPath();
      ctx.moveTo(80, 180);  // 左下角
      ctx.lineTo(520, 180); // 右下角
      ctx.lineTo(580, 320); // 右上角
      ctx.lineTo(140, 320); // 左上角
      ctx.closePath();
      ctx.fill();
      
      // 绘制透视效果的外框
      ctx.strokeStyle = '#d0d0d0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 计算方块位置
      const blockX = centerX + radius * Math.cos(angle);
      const blockY = centerY + radius * Math.sin(angle) * 0.3; // 透视效果，y轴压缩

      // 绘制圆形轨迹（虚线）
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius, radius * 0.3, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制钉子（圆心）
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // 绘制绳子
      ctx.strokeStyle = '#808080';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(blockX, blockY);
      ctx.stroke();

      // 绘制方块
      ctx.fillStyle = '#000000';
      ctx.fillRect(blockX - 8, blockY - 8, 16, 16);

      // 如果启用受力分析，绘制向心力箭头
      if (showForceRef.current) {
        // 计算向心力方向（指向圆心）
        const forceDirX = centerX - blockX;
        const forceDirY = centerY - blockY;
        const distance = Math.sqrt(forceDirX * forceDirX + forceDirY * forceDirY);
        
        if (distance > 0) {
          // 标准化方向向量
          const unitDirX = forceDirX / distance;
          const unitDirY = forceDirY / distance;
          
          // 箭头长度（适中，不超过绳子长度的一半）
          const arrowLength = Math.min(30, distance * 0.4);
          const arrowStartX = blockX;
          const arrowStartY = blockY;
          const arrowEndX = blockX + unitDirX * arrowLength;
          const arrowEndY = blockY + unitDirY * arrowLength;
          
          // 绘制向心力箭头（红色）
          ctx.strokeStyle = '#ff0000';
          ctx.fillStyle = '#ff0000';
          ctx.lineWidth = 3;
          
          // 箭头主体
          ctx.beginPath();
          ctx.moveTo(arrowStartX, arrowStartY);
          ctx.lineTo(arrowEndX, arrowEndY);
          ctx.stroke();
          
          // 箭头头部
          const headLength = 8;
          const headAngle = Math.PI / 6;
          const angle = Math.atan2(unitDirY, unitDirX);
          
          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowEndY);
          ctx.lineTo(
            arrowEndX - headLength * Math.cos(angle - headAngle),
            arrowEndY - headLength * Math.sin(angle - headAngle)
          );
          ctx.lineTo(
            arrowEndX - headLength * Math.cos(angle + headAngle),
            arrowEndY - headLength * Math.sin(angle + headAngle)
          );
          ctx.closePath();
          ctx.fill();
        }
      }

      // 更新角度
      angle += angularSpeed;
      if (angle >= 2 * Math.PI) {
        angle = 0;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showForceAnalysis]);

  return (
    <div className="min-h-screen bg-white flex">
      {/* 左侧知识点区域 */}
      <div className="w-1/3 bg-gray-50 p-8 border-r border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">水平圆周运动</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">基本概念</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• 匀速圆周运动：速度大小不变，方向不断改变</li>
              <li>• 向心力：指向圆心的合力</li>
              <li>• 向心加速度：方向指向圆心</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">基本公式</h2>
            <div className="space-y-3 text-gray-600">
              <div className="bg-white p-3 rounded border">
                <div className="font-medium">向心力：</div>
                <div className="text-center mt-1">F = mv²/r = mω²r</div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-medium">向心加速度：</div>
                <div className="text-center mt-1">a = v²/r = ω²r</div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-medium">线速度与角速度：</div>
                <div className="text-center mt-1">v = ωr</div>
                <div className="text-xs mt-2 text-gray-500">
                  线速度方向：沿圆周切线方向<br/>
                  角速度方向：垂直于圆周平面（右手定则）
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-medium">周期与频率：</div>
                <div className="text-center mt-1">T = 2π/ω = 1/f</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">关键理解</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• 向心力不是一种新的力，而是合力的效果</li>
              <li>• 线速度方向始终沿切线方向</li>
              <li>• 加速度方向始终指向圆心</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 右侧动画区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">圆周运动演示</h2>
          
          <div className="flex justify-center mb-6">
            <canvas 
              ref={canvasRef}
              className="border border-gray-300 rounded"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>

          <div className="text-center space-y-2 text-sm text-gray-600">
            <div>黑色方块：运动物体</div>
            <div>灰色钉子：圆心</div>
            <div>灰色绳子：提供向心力</div>
            <div>黑色虚线：运动轨迹</div>
            <div className="text-red-600 font-medium">红色箭头：向心力（勾选受力分析显示）</div>
          </div>
        </div>

        {/* 控制选项 */}
        <div className="flex items-center justify-center mb-6">
          <label className="flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              checked={showForceAnalysis}
              onChange={(e) => setShowForceAnalysis(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="font-medium">受力分析（显示向心力）</span>
          </label>
        </div>

        {/* 导航按钮 */}
        <div className="flex space-x-6">
          <button 
            onClick={() => navigate('/simulation')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            模拟仿真
          </button>
          <button 
            onClick={() => navigate('/quiz')}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            习题自测
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;