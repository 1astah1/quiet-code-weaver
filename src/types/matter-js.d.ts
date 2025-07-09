
declare module 'matter-js' {
  export interface Engine {
    world: World;
    timing: any;
    render?: any;
  }

  export interface World {
    gravity: Vector;
    bodies: Body[];
  }

  export interface Body {
    id: number;
    position: Vector;
    velocity: Vector;
    angle: number;
    angularVelocity: number;
    isSensor: boolean;
    isStatic: boolean;
    render: any;
    label?: string;
    circleRadius?: number;
  }

  export interface Vector {
    x: number;
    y: number;
  }

  export interface Constraint {
    bodyA: Body | null;
    bodyB: Body | null;
    pointA: Vector;
    pointB: Vector;
    length: number;
    stiffness: number;
  }

  export interface MouseConstraint {
    mouse: Mouse;
    constraint: Constraint;
  }

  export interface Mouse {
    position: Vector;
  }

  export interface Collision {
    bodyA: Body;
    bodyB: Body;
    pairs?: any[];
  }

  export interface Runner {
    delta: number;
    isFixed: boolean;
  }

  export interface Render {
    canvas: HTMLCanvasElement | null;
    context: CanvasRenderingContext2D | null;
    textures: any;
  }

  export const Engine: {
    create(): Engine;
    update(engine: Engine, delta?: number): void;
    run(engine: Engine): void;
    clear(engine: Engine): void;
  };

  export const World: {
    add(world: World, body: Body | Body[] | Constraint | Constraint[]): void;
    remove(world: World, body: Body | Body[] | Constraint | Constraint[]): void;
    clear(world: World, keepStatic?: boolean): void;
  };

  export const Bodies: {
    rectangle(x: number, y: number, width: number, height: number, options?: any): Body;
    circle(x: number, y: number, radius: number, options?: any): Body;
    polygon(x: number, y: number, sides: number, radius: number, options?: any): Body;
    trapezoid(x: number, y: number, width: number, height: number, slope: number, options?: any): Body;
  };

  export const Constraint: {
    create(options: any): Constraint;
  };

  export const Mouse: {
    create(element: HTMLElement): Mouse;
  };

  export const MouseConstraint: {
    create(engine: Engine, options: any): MouseConstraint;
  };

  export const Events: {
    on(object: any, eventName: string, callback: (event: any) => void): void;
    off(object: any, eventName: string, callback: (event: any) => void): void;
  };

  export const Vector: {
    create(x?: number, y?: number): Vector;
    add(vectorA: Vector, vectorB: Vector): Vector;
    sub(vectorA: Vector, vectorB: Vector): Vector;
    mult(vector: Vector, scalar: number): Vector;
    magnitude(vector: Vector): number;
    normalise(vector: Vector): Vector;
  };

  export const Runner: {
    create(options?: any): Runner;
    run(runner: Runner, engine: Engine): void;
    stop(runner: Runner): void;
  };

  export const Body: {
    setPosition(body: Body, position: Vector): void;
    setVelocity(body: Body, velocity: Vector): void;
    setAngle(body: Body, angle: number): void;
    setAngularVelocity(body: Body, velocity: number): void;
    setStatic(body: Body, isStatic: boolean): void;
    scale(body: Body, scaleX: number, scaleY: number, point?: Vector): void;
    translate(body: Body, translation: Vector): void;
  };

  export const Render: {
    create(options: {
      canvas?: HTMLCanvasElement;
      engine: Engine;
      options?: {
        width?: number;
        height?: number;
        wireframes?: boolean;
        background?: string;
        showAngleIndicator?: boolean;
        showCollisions?: boolean;
        showVelocity?: boolean;
      };
    }): Render;
    run(render: Render): void;
    stop(render: Render): void;
  };
}
