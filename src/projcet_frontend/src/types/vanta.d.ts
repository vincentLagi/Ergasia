// src/types/vanta.d.ts

declare module 'vanta/dist/vanta.rings.min.js' {
  interface VantaRingsOptions {
    el: HTMLElement | null;
    THREE: any;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundColor?: number;
    color?: number;
    [key: string]: any;
  }

  function RINGS(options: VantaRingsOptions): {
    destroy: () => void;
    setOptions: (options: Partial<VantaRingsOptions>) => void;
  };

  export default RINGS;
}

// Add declarations for other effects if needed
declare module 'vanta/dist/vanta.waves.min' {
  export default function WAVES(options: any): any;
}

declare module 'vanta/dist/vanta.birds.min' {
  export default function BIRDS(options: any): any;
}

// General Vanta module
declare module 'vanta' {
  const VANTA: {
    [key: string]: any;
  };
  
  export default VANTA;
}