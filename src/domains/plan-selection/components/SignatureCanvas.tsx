import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { PointerEvent } from 'react';
import { HiOutlineUser } from 'react-icons/hi';
import { useTheme } from '@/app/providers/ThemeContext';
import styles from '../pages/PlanSelectionPage.module.css';

export interface SignatureCanvasHandle {
  getImageData(): string | null;
}

interface SignatureCanvasProps {
  onDrawChange: (hasDrawn: boolean) => void;
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  function SignatureCanvas({ onDrawChange }, ref) {
    const { T } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const hasDrawnRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getImageData() {
        if (!hasDrawnRef.current) return null;
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL('image/png');
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { width } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = 160;
    }, []);

    function getCanvasPoint(event: PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const point = getCanvasPoint(event, canvas);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#111111';
      ctx.lineCap = 'round';
      canvas.setPointerCapture(event.pointerId);
      isDrawingRef.current = true;
    }

    function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const point = getCanvasPoint(event, canvas);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      if (!hasDrawnRef.current) {
        hasDrawnRef.current = true;
        onDrawChange(true);
      }
    }

    function handlePointerUp() {
      isDrawingRef.current = false;
    }

    function clearCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasDrawnRef.current = false;
      onDrawChange(false);
    }

    return (
      <div className={styles.sectionCard} style={{ borderColor: T.border, background: T.bgCard }}>
        <div className={styles.sectionLabel} style={{ color: T.text }}>
          <HiOutlineUser size={15} />
          Signature
        </div>
        <div className={styles.fieldGroup}>
          <span className={styles.subLabel} style={{ color: T.textMuted }}>
            Draw Signature
          </span>
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              width: '100%',
              height: 160,
              border: `1px dashed ${T.border}`,
              borderRadius: 10,
              background: '#ffffff',
              touchAction: 'none',
            }}
          />
          <div>
            <button
              type="button"
              onClick={clearCanvas}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                background: T.bgAlt,
                color: T.text,
                padding: '7px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear Canvas
            </button>
          </div>
        </div>
      </div>
    );
  }
);
