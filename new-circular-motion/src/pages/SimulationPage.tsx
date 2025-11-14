import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// PhET SceneryStack 类型定义
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

// 物理模拟状态
enum SimulationState {
  NORMAL_CIRCULAR_MOTION = 'normal',
  ROPE_BROKEN = 'broken'
}

// 旋转方向
enum RotationDirection {
  CLOCKWISE = 'clockwise',
  COUNTERCLOCKWISE = 'counterclockwise'
}

// PhET风格的物理模型
class CircularMotionSimulationModel {
  public angle: number = 0;
  public mass: number = 1; // kg
  public angularVelocity: number = 0.5; // rad/s (物理正确单位)
  public maxTension: number = 5; // N
  public radius: number = 1.0; // m (转换为米)
  public centerPosition: Vector2 = { x: 300, y: 220 }; // 屏幕坐标，单位：像素
  public rotationDirection: RotationDirection = RotationDirection.CLOCKWISE; // 运行方向
  
  public state: SimulationState = SimulationState.NORMAL_CIRCULAR_MOTION;
  public brokenPosition: Vector2 = { x: 0, y: 0 };
  public brokenVelocity: Vector2 = { x: 0, y: 0 };
  
  // 轨迹相关
  public trajectoryPoints: Vector2[] = [];
  public maxTrajectoryPoints: number = 200; // 最大轨迹点数量
  private trajectoryCounter: number = 0;
  private trajectoryInterval: number = 3; // 每3帧记录一个轨迹点
  
  // 时间和缩放因子
  private timeScale: number = 0.016; // 时间缩放因子，模拟真实时间流逝
  private pixelsPerMeter: number = 100; // 1米 = 100像素
  
  public get centripetalForce(): number {
    return this.mass * this.angularVelocity * this.angularVelocity * this.radius;
  }
  
  public get linearVelocity(): number {
    return this.angularVelocity * this.radius;
  }
  
  public step(deltaTime: number): void {
    if (this.state === SimulationState.NORMAL_CIRCULAR_MOTION) {
      // 如果角速度为0，小球停止运动
      if (this.angularVelocity === 0) {
        return; // 停止运动
      }
      
      // 检查绳子是否会断裂
      if (this.centripetalForce > this.maxTension) {
        this.breakRope();
      } else {
        // 正常圆周运动 - 根据旋转方向更新角度
        const directionMultiplier = this.rotationDirection === RotationDirection.CLOCKWISE ? 1 : -1;
        this.angle += this.angularVelocity * this.timeScale * directionMultiplier;
        if (this.angle >= 2 * Math.PI) {
          this.angle -= 2 * Math.PI;
        } else if (this.angle < 0) {
          this.angle += 2 * Math.PI;
        }
      }
    } else {
      // 绳子断裂后的匀速直线运动
      // 将物理速度（m/s）转换为屏幕坐标变化（像素/帧）
      const velocityPixelsPerFrame = {
        x: this.brokenVelocity.x * this.pixelsPerMeter * this.timeScale,
        y: this.brokenVelocity.y * this.pixelsPerMeter * this.timeScale * 0.3 // 透视效果
      };
      
      this.brokenPosition.x += velocityPixelsPerFrame.x;
      this.brokenPosition.y += velocityPixelsPerFrame.y;
    }
    
    // 收集轨迹点
    this.collectTrajectoryPoint();
  }
  
  private collectTrajectoryPoint(): void {
    this.trajectoryCounter++;
    if (this.trajectoryCounter >= this.trajectoryInterval) {
      const currentPos = this.getBlockPosition();
      this.trajectoryPoints.push({ ...currentPos });
      
      // 限制轨迹点数量，保持性能
      if (this.trajectoryPoints.length > this.maxTrajectoryPoints) {
        this.trajectoryPoints.shift(); // 移除最老的点
      }
      
      this.trajectoryCounter = 0;
    }
  }
  
  private breakRope(): void {
    const currentPosition = this.getBlockPosition();
    const currentVelocity = this.getCurrentVelocity();
    
    this.state = SimulationState.ROPE_BROKEN;
    this.brokenPosition = { ...currentPosition };
    this.brokenVelocity = { ...currentVelocity };
  }
  
  public getBlockPosition(): Vector2 {
    if (this.state === SimulationState.NORMAL_CIRCULAR_MOTION) {
      // 将物理单位（米）转换为屏幕坐标（像素）
      const radiusPixels = this.radius * this.pixelsPerMeter;
      return {
        x: this.centerPosition.x + radiusPixels * Math.cos(this.angle),
        y: this.centerPosition.y + radiusPixels * Math.sin(this.angle) * 0.3 // 透视效果
      };
    } else {
      return this.brokenPosition;
    }
  }
  
  private getCurrentVelocity(): Vector2 {
    // 获取当前线速度方向（切线方向）
    const tangentAngle = this.angle + Math.PI / 2;
    const velocity = this.linearVelocity; // m/s
    
    // 返回物理单位的速度（m/s），在断裂后的运动更新中再转换为像素单位
    return {
      x: velocity * Math.cos(tangentAngle),
      y: velocity * Math.sin(tangentAngle) // 注意：这里不需要透视效果，因为是物理速度
    };
  }
  
  public reset(): void {
    this.state = SimulationState.NORMAL_CIRCULAR_MOTION;
    this.angle = 0;
    this.brokenPosition = { x: 0, y: 0 };
    this.brokenVelocity = { x: 0, y: 0 };
    this.trajectoryPoints = []; // 清除轨迹
    this.trajectoryCounter = 0;
  }
  
  public clearTrajectory(): void {
    this.trajectoryPoints = [];
    this.trajectoryCounter = 0;
  }
}

// PhET风格的视图节点
class BlockNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {}
  
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
  
  constructor(private model: CircularMotionSimulationModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible || this.model.state === SimulationState.ROPE_BROKEN) return;
    
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

class TrajectoryNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    
    if (this.model.state === SimulationState.NORMAL_CIRCULAR_MOTION) {
      // 绘制圆形轨迹
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
}

class CenterNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {
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

class TrajectoryPathNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible || this.model.trajectoryPoints.length < 2) return;
    
    context.strokeStyle = '#4CAF50';
    context.lineWidth = 2;
    context.globalAlpha = 0.7;
    
    context.beginPath();
    context.moveTo(this.model.trajectoryPoints[0].x, this.model.trajectoryPoints[0].y);
    
    for (let i = 1; i < this.model.trajectoryPoints.length; i++) {
      context.lineTo(this.model.trajectoryPoints[i].x, this.model.trajectoryPoints[i].y);
    }
    
    context.stroke();
    context.globalAlpha = 1.0;
  }
}

class StatusTextNode implements SceneryNode {
  public x: number = 10;
  public y: number = 30;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    
    context.fillStyle = '#333333';
    context.font = '14px Arial';
    
    if (this.model.state === SimulationState.NORMAL_CIRCULAR_MOTION) {
      if (this.model.angularVelocity === 0) {
        context.fillStyle = '#666666';
        context.fillText('角速度为0，小球静止', this.x, this.y);
      } else {
        context.fillText(`向心力: ${this.model.centripetalForce.toFixed(2)} N`, this.x, this.y);
        context.fillText(`线速度: ${this.model.linearVelocity.toFixed(2)} m/s`, this.x, this.y + 20);
      }
    } else {
      context.fillStyle = '#ff0000';
      context.fillText('绳子断裂！物体做匀速直线运动', this.x, this.y);
    }
    
    // 显示轨迹信息
    context.fillStyle = '#4CAF50';
    context.fillText(`轨迹点数: ${this.model.trajectoryPoints.length}`, this.x, this.y + 40);
  }
}

// 角速度箭头（绿色）- 垂直圆周平面方向
class AngularVelocityArrowNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible || this.model.state !== SimulationState.NORMAL_CIRCULAR_MOTION) return;
    if (this.model.angularVelocity === 0) return;
    
    const blockPos = this.model.getBlockPosition();
    this.x = blockPos.x;
    this.y = blockPos.y;
    
    // 角速度方向：顺时针向下，逆时针向上
    const isClockwise = this.model.rotationDirection === RotationDirection.CLOCKWISE;
    const arrowLength = 50; // 增加长度
    const endX = this.x;
    const endY = this.y + (isClockwise ? arrowLength : -arrowLength);
    
    // 绘制箭头线
    context.strokeStyle = '#4CAF50'; // 绿色
    context.lineWidth = 4; // 增加线宽
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(endX, endY);
    context.stroke();
    
    // 绘制箭头头部
    const headLength = 12; // 增加头部大小
    const headAngle = Math.PI / 6;
    
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(
      endX + headLength * Math.sin(headAngle),
      endY + (isClockwise ? -headLength * Math.cos(headAngle) : headLength * Math.cos(headAngle))
    );
    context.moveTo(endX, endY);
    context.lineTo(
      endX - headLength * Math.sin(headAngle),
      endY + (isClockwise ? -headLength * Math.cos(headAngle) : headLength * Math.cos(headAngle))
    );
    context.stroke();
    
    // 添加标签
    context.fillStyle = '#4CAF50';
    context.font = 'bold 14px Arial'; // 增加字体大小和粗细
    context.fillText('ω', this.x + 18, this.y - 8);
  }
}

// 线速度箭头（黄色）- 圆周切线方向
class LinearVelocityArrowNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return;
    if (this.model.angularVelocity === 0 && this.model.state === SimulationState.NORMAL_CIRCULAR_MOTION) return;
    
    const blockPos = this.model.getBlockPosition();
    this.x = blockPos.x;
    this.y = blockPos.y;
    
    let tangentAngle: number;
    let velocityMagnitude: number;
    
    if (this.model.state === SimulationState.NORMAL_CIRCULAR_MOTION) {
      // 圆周运动：切线方向，根据旋转方向调整
      const directionMultiplier = this.model.rotationDirection === RotationDirection.CLOCKWISE ? 1 : -1;
      tangentAngle = this.model.angle + (Math.PI / 2) * directionMultiplier;
      velocityMagnitude = Math.max(30, Math.min(this.model.linearVelocity * 50, 80)); // 增加缩放因子，确保最小长度30像素
    } else {
      // 绳子断裂：沿当前速度方向
      tangentAngle = Math.atan2(this.model.brokenVelocity.y, this.model.brokenVelocity.x);
      velocityMagnitude = Math.max(30, Math.min(this.model.linearVelocity * 50, 80));
    }
    
    const endX = this.x + velocityMagnitude * Math.cos(tangentAngle);
    const endY = this.y + velocityMagnitude * Math.sin(tangentAngle); // 移除透视效果，确保方向正确
    
    // 绘制箭头线
    context.strokeStyle = '#FFC107'; // 黄色
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(endX, endY);
    context.stroke();
    
    // 绘制箭头头部
    const headLength = 10;
    const headAngle = Math.PI / 6;
    
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(
      endX - headLength * Math.cos(tangentAngle - headAngle),
      endY - headLength * Math.sin(tangentAngle - headAngle) // 移除透视效果
    );
    context.moveTo(endX, endY);
    context.lineTo(
      endX - headLength * Math.cos(tangentAngle + headAngle),
      endY - headLength * Math.sin(tangentAngle + headAngle) // 移除透视效果
    );
    context.stroke();
    
    // 添加标签
    context.fillStyle = '#FFC107';
    context.font = '12px Arial';
    const labelX = this.x + (velocityMagnitude + 20) * Math.cos(tangentAngle);
    const labelY = this.y + (velocityMagnitude + 20) * Math.sin(tangentAngle); // 移除透视效果
    context.fillText('v', labelX - 5, labelY - 5);
  }
}

// 向心加速度箭头（红色）- 指向圆心
class CentripetalAccelerationArrowNode implements SceneryNode {
  public x: number = 0;
  public y: number = 0;
  public visible: boolean = true;
  
  constructor(private model: CircularMotionSimulationModel) {}
  
  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible || this.model.state !== SimulationState.NORMAL_CIRCULAR_MOTION) return;
    if (this.model.angularVelocity === 0) return;
    
    const blockPos = this.model.getBlockPosition();
    this.x = blockPos.x;
    this.y = blockPos.y;
    
    // 向心加速度方向：指向圆心
    const centerPos = this.model.centerPosition;
    const angleToCenter = Math.atan2(centerPos.y - this.y, centerPos.x - this.x);
    const accelerationMagnitude = Math.max(30, Math.min(this.model.centripetalForce / this.model.mass * 20, 70)); // 增加缩放因子，确保最小长度30像素
    
    const endX = this.x + accelerationMagnitude * Math.cos(angleToCenter);
    const endY = this.y + accelerationMagnitude * Math.sin(angleToCenter); // 移除透视效果，确保方向正确
    
    // 绘制箭头线
    context.strokeStyle = '#F44336'; // 红色
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(this.x, this.y);
    context.lineTo(endX, endY);
    context.stroke();
    
    // 绘制箭头头部
    const headLength = 10;
    const headAngle = Math.PI / 6;
    
    context.beginPath();
    context.moveTo(endX, endY);
    context.lineTo(
      endX - headLength * Math.cos(angleToCenter - headAngle),
      endY - headLength * Math.sin(angleToCenter - headAngle) // 移除透视效果
    );
    context.moveTo(endX, endY);
    context.lineTo(
      endX - headLength * Math.cos(angleToCenter + headAngle),
      endY - headLength * Math.sin(angleToCenter + headAngle) // 移除透视效果
    );
    context.stroke();
    
    // 添加标签
    context.fillStyle = '#F44336';
    context.font = '12px Arial';
    const labelX = this.x + (accelerationMagnitude + 20) * Math.cos(angleToCenter);
    const labelY = this.y + (accelerationMagnitude + 20) * Math.sin(angleToCenter); // 移除透视效果
    context.fillText('a', labelX - 5, labelY - 5);
  }
}

// PhET风格的根场景
class SimulationScene {
  private nodes: SceneryNode[] = [];
  private model: CircularMotionSimulationModel;
  
  constructor(model: CircularMotionSimulationModel) {
    this.model = model;
    this.createNodes();
  }
  
  private createNodes(): void {
    this.nodes = [
      new PlaneNode(),
      new TrajectoryNode(this.model),
      new CenterNode(this.model),
      new RopeNode(this.model),
      new TrajectoryPathNode(this.model), // 轨迹路径节点
      new BlockNode(this.model),
      // 矢量箭头节点（按顺序绘制，确保正确的覆盖关系）
      new CentripetalAccelerationArrowNode(this.model), // 红色箭头，先绘制
      new LinearVelocityArrowNode(this.model),          // 黄色箭头
      new AngularVelocityArrowNode(this.model),         // 绿色箭头，最后绘制
      new StatusTextNode(this.model)
    ];
  }
  
  public render(context: CanvasRenderingContext2D): void {
    this.nodes.forEach(node => node.render(context));
  }
  
  public step(deltaTime: number): void {
    this.model.step(deltaTime);
  }
  
  public updateParameters(params: Partial<CircularMotionSimulationModel>): void {
    Object.assign(this.model, params);
  }
}

// 参数控制组件
interface ParameterControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

const ParameterControl: React.FC<ParameterControlProps> = ({ 
  label, value, min, max, step, unit, onChange 
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}: {value.toFixed(2)} {unit}
      </label>
      <div className="flex items-center space-x-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value.toFixed(2)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

const SimulationPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const navigate = useNavigate();
  
  // 模型参数状态
  const [mass, setMass] = useState(1); // kg
  const [angularVelocity, setAngularVelocity] = useState(0.5); // rad/s
  const [maxTension, setMaxTension] = useState(5); // N
  const [radius, setRadius] = useState(1.0); // m
  const [rotationDirection, setRotationDirection] = useState(RotationDirection.CLOCKWISE);
  
  // 暂停状态
  const [isPaused, setIsPaused] = useState(false);
  
  // 初始值常量
  const INITIAL_VALUES = {
    mass: 1,
    angularVelocity: 0.5,
    maxTension: 5,
    radius: 1.0,
    rotationDirection: RotationDirection.CLOCKWISE
  };
  
  // 使用useRef存储模型和场景
  const modelRef = useRef<CircularMotionSimulationModel>(new CircularMotionSimulationModel());
  const sceneRef = useRef<SimulationScene>(new SimulationScene(modelRef.current));
  
  // 同步参数到模型
  useEffect(() => {
    modelRef.current.mass = mass;
    modelRef.current.angularVelocity = angularVelocity;
    modelRef.current.maxTension = maxTension;
    modelRef.current.radius = radius;
    modelRef.current.rotationDirection = rotationDirection;
  }, [mass, angularVelocity, maxTension, radius, rotationDirection]);
  
  // 初始化动画
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
      
      // 如果未暂停，更新物理模型
      if (!isPaused) {
        sceneRef.current.step(1);
      }
      
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
  }, [isPaused]); // 依赖isPaused，当暂停状态改变时重新创建动画循环
  
  const handleReset = () => {
    // 重置模型状态
    modelRef.current.reset();
    
    // 重置参数到初始值
    setMass(INITIAL_VALUES.mass);
    setAngularVelocity(INITIAL_VALUES.angularVelocity);
    setMaxTension(INITIAL_VALUES.maxTension);
    setRadius(INITIAL_VALUES.radius);
    setRotationDirection(INITIAL_VALUES.rotationDirection);
    
    // 确保暂停状态为false
    setIsPaused(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 左侧参数控制面板 */}
      <div className="w-1/3 bg-white p-6 border-r border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">圆周运动仿真</h1>
        
        <div className="space-y-4">
          <ParameterControl
            label="质量 (m)"
            value={mass}
            min={0.01}
            max={10}
            step={0.01}
            unit="kg"
            onChange={setMass}
          />
          
          <ParameterControl
            label="角速度 (ω)"
            value={angularVelocity}
            min={0}
            max={2}
            step={0.01}
            unit="rad/s"
            onChange={setAngularVelocity}
          />
          
          <ParameterControl
            label="最大拉力 (F)"
            value={maxTension}
            min={0}
            max={10}
            step={0.1}
            unit="N"
            onChange={setMaxTension}
          />
          
          <ParameterControl
            label="半径 (r)"
            value={radius}
            min={0}
            max={10}
            step={0.1}
            unit="m"
            onChange={setRadius}
          />
          
          {/* 运行方向选择 */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3">运行方向</h3>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rotationDirection"
                  value={RotationDirection.CLOCKWISE}
                  checked={rotationDirection === RotationDirection.CLOCKWISE}
                  onChange={(e) => setRotationDirection(e.target.value as RotationDirection)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-gray-700">顺时针</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="rotationDirection"
                  value={RotationDirection.COUNTERCLOCKWISE}
                  checked={rotationDirection === RotationDirection.COUNTERCLOCKWISE}
                  onChange={(e) => setRotationDirection(e.target.value as RotationDirection)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-gray-700">逆时针</span>
              </label>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">物理提示</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>向心力 = m × ω² × r</div>
              <div>当向心力 ＞ 最大拉力时，绳子断裂</div>
              <div>断裂后物体沿切线方向匀速运动</div>
            </div>
          </div>
          
          <button
            onClick={() => modelRef.current.clearTrajectory()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            清除轨迹
          </button>
        </div>
      </div>
      
      {/* 右侧动画区域 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">交互式仿真</h2>
          
          <div className="flex justify-center mb-4">
            <canvas 
              ref={canvasRef}
              className="border border-gray-300 rounded"
              style={{ backgroundColor: '#ffffff' }}
            />
          </div>
          
          <div className="text-center space-y-1 text-sm text-gray-600">
            <div>黑色方块：运动物体</div>
            <div>灰色钉子：圆心</div>
            <div>灰色绳子：提供向心力</div>
            <div>黑色虚线：运动轨迹</div>
            <div className="flex justify-center space-x-6 mt-2">
              <span className="text-green-600">绿色箭头：角速度 ω</span>
              <span className="text-yellow-600">黄色箭头：线速度 v</span>
              <span className="text-red-600">红色箭头：向心加速度 a</span>
            </div>
            <div className="text-red-600 mt-2">当向心力超过最大拉力时，绳子断裂</div>
          </div>
        </div>
        
        {/* 控制按钮 */}
        <div className="flex space-x-4 mb-4">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${
              isPaused 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isPaused ? '继续' : '暂停'}
          </button>
          <button 
            onClick={handleReset}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            重置仿真
          </button>
        </div>
        
        {/* 导航按钮 */}
        <div className="flex space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            返回主页
          </button>
          <button 
            onClick={() => navigate('/quiz')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            习题自测
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationPage;