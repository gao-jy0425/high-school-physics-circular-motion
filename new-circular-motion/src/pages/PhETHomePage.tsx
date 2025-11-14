import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// PhET SceneryStack 类型定义（简化版）
interface SceneryNode {
  x: number;
  y: number;
  visible: boolean;
  render(context: CanvasRenderingContext2D): void;
}

interface Vector2 {
  x: number;
  y: number;
}

// PhET风格的物理模型
class CircularMotionModel {
  public angle: number = 0;
  public angularVelocity: number = 0.05; // 增加角速度让动画更明显
  public radius: number = 70;
  public centerPosition: Vector2 = { x: 300, y: 220 };
  public showForceAnalysis: boolean = false;
  
  public step(deltaTime: number): void {
    // 每帧增加角度，确保动画流畅
    this.angle += this.angularVelocity;
    if (this.angle >= 2 * Math.PI) {
      this.angle -= 2 * Math.PI;
    }
  }
  
  public getBlockPosition(): Vector2 {
    return {
      x: this.centerPosition.x + this.radius * Math.cos(this.angle),
      y: this.centerPosition.y + this.radius * Math.sin(this.angle) * 0.3
    };
  }
  
  public getCentripetalForceDirection(): Vector2 {
    const blockPos = this.getBlockPosition();
    const dx = this.centerPosition.x - blockPos.x;
    const dy = this.centerPosition.y - blockPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 };
  }
}

// PhET风格的视图节点
class BlockNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    
    const position = this.model.getBlockPosition();
    this.x = position.x;
    this.y = position.y;
    
    context.fillStyle = '#000000';
    context.fillRect(this.x - 8, this.y - 8, 16, 16);
  }
}

class RopeNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    
    const blockPos = this.model.getBlockPosition();
    const centerPos = this.model.centerPosition;
    
    context.strokeStyle = '#808080';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(centerPos.x, centerPos.y);
    context.lineTo(blockPos.x, blockPos.y);
    context.stroke();
  }
}

class CentripetalForceArrowNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  private arrowLength: number = 30;
  
  constructor(private model: CircularMotionModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible || !this.model.showForceAnalysis) return;
    
    const blockPos = this.model.getBlockPosition();
    const centerPos = this.model.centerPosition;
    
    // 直接计算从方块指向圆心的方向，确保与绳子完全重合
    const dx = centerPos.x - blockPos.x;
    const dy = centerPos.y - blockPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // 计算箭头终点，确保方向与绳子完全一致
    const unitX = dx / distance;
    const unitY = dy / distance;
    const endX = blockPos.x + unitX * this.arrowLength;
    const endY = blockPos.y + unitY * this.arrowLength;
    
    // 绘制箭头主体
    context.strokeStyle = '#ff0000';
    context.fillStyle = '#ff0000';
    context.lineWidth = 3;
    
    context.beginPath();
    context.moveTo(blockPos.x, blockPos.y);
    context.lineTo(endX, endY);
    context.stroke();
    
    // 绘制箭头头部，使用与绳子相同的方向
    const headLength = 8;
    const headAngle = Math.PI / 6;
    const angle = Math.atan2(unitY, unitX);
    
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(
      endX - headLength * Math.cos(angle - headAngle),
      endY - headLength * Math.sin(angle - headAngle)
    );
    context.lineTo(
      endX - headLength * Math.cos(angle + headAngle),
      endY - headLength * Math.sin(angle + headAngle)
    );
    context.closePath();
    context.fill();
    
    // 添加标签
    context.fillStyle = '#ff0000';
    context.font = '12px Arial';
    const labelX = endX + 10 * Math.cos(angle);
    const labelY = endY + 10 * Math.sin(angle);
    context.fillText('F', labelX - 5, labelY - 5);
  }
}

class TrajectoryNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    
    context.strokeStyle = '#000000';
    context.lineWidth = 1;
    context.setLineDash([5, 5]);
    context.beginPath();
    context.ellipse(
      this.model.centerPosition.x,
      this.model.centerPosition.y,
      this.model.radius,
      this.model.radius * 0.3,
      0, 0, 2 * Math.PI
    );
    context.stroke();
    context.setLineDash([]);
  }
}

class CenterNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionModel) {
    this.x = model.centerPosition.x;
    this.y = model.centerPosition.y;
  }
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    
    context.fillStyle = '#808080';
    context.beginPath();
    context.arc(this.x, this.y, 4, 0, 2 * Math.PI);
    context.fill();
  }
}

class PlaneNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor() {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    
    // 绘制透视平面（平行四边形）
    context.fillStyle = '#f0f0f0';
    context.beginPath();
    context.moveTo(80, 180);   // 左下角
    context.lineTo(520, 180);  // 右下角
    context.lineTo(580, 320);  // 右上角
    context.lineTo(140, 320);  // 左上角
    context.closePath();
    context.fill();
    
    context.strokeStyle = '#d0d0d0';
    context.lineWidth = 2;
    context.stroke();
  }
}

// PhET风格的根场景
class SimulationScene {
  private nodes: SceneryNode[] = [];
  private model: CircularMotionModel;
  
  constructor(model: CircularMotionModel) {
    this.model = model;
    this.createNodes();
  }
  
  private createNodes(): void {
    this.nodes = [
      new PlaneNode(),
      new TrajectoryNode(this.model),
      new CenterNode(this.model),
      new RopeNode(this.model),
      new BlockNode(this.model),
      new CentripetalForceArrowNode(this.model)
    ];
  }
  
  public render(context: CanvasRenderingContext2D): void {
    this.nodes.forEach(node => node.render(context));
  }
  
  public step(deltaTime: number): void {
    this.model.step(deltaTime);
  }
  
  public setForceAnalysisVisible(visible: boolean): void {
    this.model.showForceAnalysis = visible;
  }
}

const PhETHomePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const navigate = useNavigate();
  const [showForceAnalysis, setShowForceAnalysis] = useState(false);
  
  // 使用useRef存储模型和场景，避免重新创建
  const modelRef = useRef<CircularMotionModel>(new CircularMotionModel());
  const sceneRef = useRef<SimulationScene>(new SimulationScene(modelRef.current));
  const showForceRef = useRef(showForceAnalysis);
  
  // 同步状态到ref，避免动画重启
  useEffect(() => {
    showForceRef.current = showForceAnalysis;
    // 直接更新模型状态
    modelRef.current.showForceAnalysis = showForceAnalysis;
  }, [showForceAnalysis]);
  
  // 初始化动画，只运行一次
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 600;
    canvas.height = 400;
    
    let animationId: number;
    
    const animate = () => {
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 更新物理模型 - 使用固定时间步长确保稳定动画
      sceneRef.current.step(1);
      // 不需要在这里设置状态，状态已经在useEffect中同步
      
      // 渲染场景
      sceneRef.current.render(ctx);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []); // 空依赖数组，只运行一次
  
  // 单独处理受力分析状态变化，避免重新创建动画循环
  useEffect(() => {
    // 直接更新模型状态，不需要通过场景设置
    modelRef.current.showForceAnalysis = showForceAnalysis;
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
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">PhET风格圆周运动演示</h2>
          
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

export default PhETHomePage;