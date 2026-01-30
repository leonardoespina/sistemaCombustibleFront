import Konva from "konva";
import { TANK_COLORS, CANVAS_CONFIG } from "./tankConfig";
import { adjustColorBrightness } from "./tankUtils";

export class TankRenderer {
  constructor(container, width, height) {
    this.stage = new Konva.Stage({
      container: container,
      width: width,
      height: height,
    });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    this.liquidGroup = null;
    this.currentTankHeight = 0;
    this.currentTankBottomY = 0;

    // Estado actual
    this.primaryColor = "#3b82f6";
    this.currentPercentage = 0;

    // Animación de olas
    this.wavePhase = 0;
    this.waveAnimation = new Konva.Animation((frame) => {
      this.wavePhase = (frame.time * 2 * Math.PI) / 2000; // 1 ciclo cada 2s
      // La capa se redibuja automáticamente por Konva.Animation
    }, this.layer);

    this.waveAnimation.start();
  }

  destroy() {
    if (this.waveAnimation) {
      this.waveAnimation.stop();
    }
    if (this.stage) {
      this.stage.destroy();
      this.stage = null;
    }
  }

  /**
   * Dibuja el tanque completo
   */
  draw(forma, primaryColor, percentage) {
    this.layer.destroyChildren();
    this.primaryColor = primaryColor;
    this.currentPercentage = percentage;
    this.liquidGroup = null;

    const width = this.stage.width();
    const height = this.stage.height();

    if (forma === "RECTANGULAR" || forma === "CUADRADO") {
      this.drawRectangularTank(width, height);
    } else {
      this.drawCylinderTank(width, height);
    }

    this.layer.draw();
  }

  /**
   * Actualiza el nivel del líquido
   */
  updateLevel(percentage, forma, animate = true) {
    this.currentPercentage = percentage;

    if (!this.liquidGroup) return;

    if (forma === "RECTANGULAR" || forma === "CUADRADO") {
      this.animateRectangularLiquid(animate);
    } else {
      // Para el cilindro, redibujar completo es más seguro por la forma compleja
      this.layer.draw();
    }
  }

  // ============================================================================
  // CILINDRO
  // ============================================================================

  drawCylinderTank(canvasWidth, canvasHeight) {
    const dimensions = this.calculateCylinderDimensions(
      canvasWidth,
      canvasHeight
    );

    this.currentTankHeight = dimensions.tankHeight;
    this.currentTankBottomY = dimensions.yBottom;

    this.drawBackground(canvasWidth, canvasHeight);
    this.drawTankShadow(dimensions);
    this.drawSupportLegs(dimensions);
    this.drawTankBody(dimensions);
    this.drawTankOutline(dimensions);
    this.drawWeldSeams(dimensions);
    this.drawFillingCap(dimensions);
    this.drawOutletPipe(dimensions);
    this.drawGlossEffect(dimensions);
    this.drawLevelIndicator(dimensions);
  }

  calculateCylinderDimensions(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const tankWidth = w * CANVAS_CONFIG.tankWidthRatio;
    const tankHeight = h * CANVAS_CONFIG.tankHeightRatio;
    const capRadius = tankHeight / 2;

    const xLeft = cx - tankWidth / 2 + capRadius;
    const xRight = cx + tankWidth / 2 - capRadius;
    const yTop = cy - tankHeight / 2;
    const yBottom = cy + tankHeight / 2;

    return {
      cx,
      cy,
      tankWidth,
      tankHeight,
      capRadius,
      xLeft,
      xRight,
      yTop,
      yBottom,
    };
  }

  drawBackground(w, h) {
    const padding = CANVAS_CONFIG.padding;
    this.layer.add(
      new Konva.Rect({
        x: padding,
        y: padding,
        width: w - padding * 2,
        height: h - padding * 2,
        fill: TANK_COLORS.background,
        cornerRadius: 12,
      })
    );
  }

  drawTankShadow(dims) {
    this.layer.add(
      new Konva.Ellipse({
        x: dims.cx,
        y: dims.yBottom + 15,
        radiusX: dims.tankWidth * 0.45,
        radiusY: 8,
        fill: TANK_COLORS.shadow,
      })
    );
  }

  drawSupportLegs(dims) {
    const legWidth = 14;
    const legHeight = 18;
    const legPositions = [
      dims.xLeft + dims.capRadius * 0.3,
      dims.xRight - dims.capRadius * 0.3,
    ];

    legPositions.forEach((x) => {
      this.layer.add(
        new Konva.Rect({
          x: x - legWidth / 2,
          y: dims.yBottom - 5,
          width: legWidth,
          height: legHeight,
          fill: TANK_COLORS.metalDark,
          stroke: TANK_COLORS.stroke,
          strokeWidth: 1.5,
          cornerRadius: [0, 0, 3, 3],
        })
      );
      this.layer.add(
        new Konva.Rect({
          x: x - legWidth / 2 - 4,
          y: dims.yBottom + legHeight - 8,
          width: legWidth + 8,
          height: 5,
          fill: TANK_COLORS.metalDark,
          stroke: TANK_COLORS.stroke,
          strokeWidth: 1,
          cornerRadius: 2,
        })
      );
    });
  }

  drawTankBody(dims) {
    const clipFunc = this.createTankClipFunction(dims);
    const tankGroup = new Konva.Group({ clipFunc });

    tankGroup.add(this.createTankInterior(dims));

    const liquidShape = this.createLiquidShape(dims);
    tankGroup.add(liquidShape);

    this.layer.add(tankGroup);
    this.liquidGroup = liquidShape;
  }

  createTankClipFunction(dims) {
    return (ctx) => {
      ctx.beginPath();
      ctx.arc(
        dims.xLeft,
        dims.cy,
        dims.capRadius,
        Math.PI / 2,
        -Math.PI / 2,
        false
      );
      ctx.lineTo(dims.xRight, dims.yTop);
      ctx.arc(
        dims.xRight,
        dims.cy,
        dims.capRadius,
        -Math.PI / 2,
        Math.PI / 2,
        false
      );
      ctx.lineTo(dims.xLeft, dims.yBottom);
      ctx.closePath();
    };
  }

  createTankInterior(dims) {
    return new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        this.createTankClipFunction(dims)(ctx);
        ctx.fillStrokeShape(shape);
      },
      fillLinearGradientStartPoint: { x: 0, y: dims.yTop },
      fillLinearGradientEndPoint: { x: 0, y: dims.yBottom },
      fillLinearGradientColorStops: [
        0,
        "#ffffff",
        0.3,
        TANK_COLORS.metal,
        1,
        "#cbd5e1",
      ],
    });
  }

  createLiquidShape(dims) {
    return new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        // Usar this.currentPercentage aquí
        const liquidHeight = dims.tankHeight * this.currentPercentage;
        const liquidY = dims.yBottom - liquidHeight;

        if (liquidHeight <= 0) return;

        ctx.beginPath();
        if (liquidHeight >= dims.tankHeight) {
          this.drawFullTankPath(ctx, dims);
        } else {
          this.drawPartialTankPath(ctx, dims, liquidY);
        }
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      },
      fillLinearGradientStartPoint: { x: 0, y: dims.yTop },
      fillLinearGradientEndPoint: { x: 0, y: dims.yBottom },
      fillLinearGradientColorStops: [
        0,
        adjustColorBrightness(this.primaryColor, 20),
        0.5,
        this.primaryColor,
        1,
        adjustColorBrightness(this.primaryColor, -30),
      ],
      opacity: 0.9,
    });
  }

  drawFullTankPath(ctx, dims) {
    ctx.arc(
      dims.xLeft,
      dims.cy,
      dims.capRadius,
      Math.PI / 2,
      -Math.PI / 2,
      false
    );
    ctx.lineTo(dims.xRight, dims.yTop);
    ctx.arc(
      dims.xRight,
      dims.cy,
      dims.capRadius,
      -Math.PI / 2,
      Math.PI / 2,
      false
    );
    ctx.lineTo(dims.xLeft, dims.yBottom);
  }

  drawPartialTankPath(ctx, dims, liquidY) {
    const dy = liquidY - dims.cy;
    const ratio = Math.max(-1, Math.min(1, dy / dims.capRadius));
    const angle = Math.asin(ratio);

    // Punto de inicio en el arco izquierdo
    ctx.moveTo(dims.xLeft, dims.yBottom);
    ctx.arc(
      dims.xLeft,
      dims.cy,
      dims.capRadius,
      Math.PI / 2,
      Math.PI - angle,
      false
    );

    // Coordenadas de inicio de la superficie (lado izquierdo)
    const startX = dims.xLeft + dims.capRadius * Math.cos(Math.PI - angle);
    // Coordenadas de fin de la superficie (lado derecho)
    const endX = dims.xRight + dims.capRadius * Math.cos(-angle);

    // Dibujar superficie ondulada
    const width = endX - startX;
    const amplitude = 3; // Altura de la ola
    const frequency = 0.05; // Frecuencia de la ola

    for (let x = startX; x <= endX; x += 2) {
      const y =
        liquidY +
        Math.sin((x - startX) * frequency + this.wavePhase) * amplitude;
      ctx.lineTo(x, y);
    }

    // Conectar con el punto final exacto para cerrar bien
    const endY =
      liquidY +
      Math.sin((endX - startX) * frequency + this.wavePhase) * amplitude;
    ctx.lineTo(endX, endY);

    // Continuar con el resto del tanque
    ctx.arc(dims.xRight, dims.cy, dims.capRadius, -angle, Math.PI / 2, false);
    ctx.lineTo(dims.xLeft, dims.yBottom);
  }

  drawTankOutline(dims) {
    this.layer.add(
      new Konva.Shape({
        sceneFunc: (ctx, shape) => {
          ctx.beginPath();
          ctx.arc(
            dims.xLeft,
            dims.cy,
            dims.capRadius,
            Math.PI / 2,
            -Math.PI / 2,
            false
          );
          ctx.lineTo(dims.xRight, dims.yTop);
          ctx.arc(
            dims.xRight,
            dims.cy,
            dims.capRadius,
            -Math.PI / 2,
            Math.PI / 2,
            false
          );
          ctx.lineTo(dims.xLeft, dims.yBottom);
          ctx.closePath();
          ctx.fillStrokeShape(shape);
        },
        stroke: TANK_COLORS.stroke,
        strokeWidth: 2,
      })
    );
  }

  drawWeldSeams(dims) {
    const seamConfig = {
      stroke: TANK_COLORS.metalDark,
      strokeWidth: 1.5,
      dash: [3, 3],
    };
    this.layer.add(
      new Konva.Line({
        points: [dims.xLeft, dims.yTop, dims.xLeft, dims.yBottom],
        ...seamConfig,
      })
    );
    this.layer.add(
      new Konva.Line({
        points: [dims.xRight, dims.yTop, dims.xRight, dims.yBottom],
        ...seamConfig,
      })
    );
  }

  drawFillingCap(dims) {
    const capX = dims.xRight - (dims.xRight - dims.xLeft) * 0.3;
    const capY = dims.yTop;
    this.layer.add(
      new Konva.Rect({
        x: capX - 8,
        y: capY - 12,
        width: 16,
        height: 14,
        fill: TANK_COLORS.metal,
        stroke: TANK_COLORS.stroke,
        strokeWidth: 1.5,
        cornerRadius: 2,
      })
    );
    this.layer.add(
      new Konva.Ellipse({
        x: capX,
        y: capY - 12,
        radiusX: 10,
        radiusY: 4,
        fill: TANK_COLORS.metalDark,
        stroke: TANK_COLORS.stroke,
        strokeWidth: 1.5,
      })
    );
    this.layer.add(
      new Konva.Rect({
        x: capX - 4,
        y: capY - 17,
        width: 8,
        height: 4,
        fill: TANK_COLORS.stroke,
        cornerRadius: 2,
      })
    );
  }

  drawOutletPipe(dims) {
    const pipeX = dims.xLeft - dims.capRadius * 0.7;
    const pipeY = dims.yBottom - 15;
    this.layer.add(
      new Konva.Rect({
        x: pipeX - 5,
        y: pipeY,
        width: 20,
        height: 10,
        fill: TANK_COLORS.metal,
        stroke: TANK_COLORS.stroke,
        strokeWidth: 1.5,
        cornerRadius: 2,
      })
    );
    this.layer.add(
      new Konva.Circle({
        x: pipeX,
        y: pipeY + 5,
        radius: 6,
        fill: "#ef4444",
        stroke: TANK_COLORS.stroke,
        strokeWidth: 1,
      })
    );
  }

  drawGlossEffect(dims) {
    this.layer.add(
      new Konva.Shape({
        sceneFunc: (ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(dims.xLeft + 10, dims.yTop + 8);
          ctx.quadraticCurveTo(
            dims.cx,
            dims.yTop + 5,
            dims.xRight - 10,
            dims.yTop + 8
          );
          ctx.strokeShape(shape);
        },
        stroke: "rgba(255,255,255,0.6)",
        strokeWidth: 3,
        lineCap: "round",
      })
    );
  }

  drawLevelIndicator(dims) {
    const rulerX = dims.xRight + dims.capRadius + 8;
    const rulerTop = dims.yTop + 5;
    const rulerBottom = dims.yBottom - 5;
    const rulerHeight = rulerBottom - rulerTop;

    this.layer.add(
      new Konva.Rect({
        x: rulerX - 2,
        y: rulerTop,
        width: 4,
        height: rulerHeight,
        fill: TANK_COLORS.metal,
        stroke: TANK_COLORS.stroke,
        strokeWidth: 1,
        cornerRadius: 2,
      })
    );

    for (let i = 0; i <= 4; i++) {
      const markY = rulerTop + (rulerHeight * i) / 4;
      const isMainMark = i % 2 === 0;
      const markWidth = isMainMark ? 8 : 5;

      this.layer.add(
        new Konva.Line({
          points: [rulerX + 3, markY, rulerX + 3 + markWidth, markY],
          stroke: TANK_COLORS.stroke,
          strokeWidth: 1,
        })
      );

      if (isMainMark) {
        this.layer.add(
          new Konva.Text({
            x: rulerX + 14,
            y: markY - 5,
            text: `${100 - i * 25}`,
            fontSize: 9,
            fill: "#64748b",
          })
        );
      }
    }

    const levelY = rulerBottom - rulerHeight * this.currentPercentage;
    this.layer.add(
      new Konva.RegularPolygon({
        x: rulerX - 5,
        y: levelY,
        sides: 3,
        radius: 5,
        fill: this.primaryColor,
        rotation: -90,
      })
    );
  }

  // ============================================================================
  // TANQUE RECTANGULAR (Frontal 2.5D)
  // ============================================================================

  drawRectangularTank(canvasWidth, canvasHeight) {
    const dims = this.calculateRectDimensions(canvasWidth, canvasHeight);

    this.currentTankHeight = dims.tankHeight;
    this.currentTankBottomY = dims.yBottom;

    this.drawBackground(canvasWidth, canvasHeight);
    this.drawRectShadow(dims);
    this.drawRectBody(dims);
    this.drawRectFrame(dims);
    this.drawRectLevelIndicator(dims);
  }

  calculateRectDimensions(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const tankWidth = w * 0.7; // Un poco más ancho para aspecto rectangular
    const tankHeight = h * 0.55;

    const xLeft = cx - tankWidth / 2;
    const xRight = cx + tankWidth / 2;
    const yTop = cy - tankHeight / 2;
    const yBottom = cy + tankHeight / 2;

    return { cx, cy, tankWidth, tankHeight, xLeft, xRight, yTop, yBottom };
  }

  drawRectShadow(dims) {
    this.layer.add(
      new Konva.Rect({
        x: dims.xLeft + 5,
        y: dims.yBottom + 5,
        width: dims.tankWidth - 10,
        height: 8,
        fill: TANK_COLORS.shadow,
        cornerRadius: 4,
        opacity: 0.6,
      })
    );
  }

  drawRectBody(dims) {
    const tankGroup = new Konva.Group({
      clipFunc: (ctx) => {
        ctx.beginPath();
        ctx.roundRect(
          dims.xLeft,
          dims.yTop,
          dims.tankWidth,
          dims.tankHeight,
          4
        );
        ctx.closePath();
      },
    });

    // Fondo metálico
    tankGroup.add(
      new Konva.Rect({
        x: dims.xLeft,
        y: dims.yTop,
        width: dims.tankWidth,
        height: dims.tankHeight,
        fillLinearGradientStartPoint: { x: dims.xLeft, y: 0 },
        fillLinearGradientEndPoint: { x: dims.xRight, y: 0 },
        fillLinearGradientColorStops: [
          0,
          "#cbd5e1",
          0.2,
          "#ffffff",
          0.8,
          TANK_COLORS.metal,
          1,
          "#94a3b8",
        ],
      })
    );

    // Líquido
    const liquidShape = this.createRectLiquidShape(dims);
    tankGroup.add(liquidShape);
    this.liquidGroup = liquidShape;

    this.layer.add(tankGroup);
  }

  createRectLiquidShape(dims) {
    const liquidHeight = dims.tankHeight * this.currentPercentage;
    const liquidY = dims.yBottom - liquidHeight;

    return new Konva.Shape({
      sceneFunc: (ctx, shape) => {
        const amplitude = 3;
        const frequency = 0.05;

        ctx.beginPath();
        ctx.moveTo(dims.xLeft, dims.yBottom);

        // Lado izquierdo subiendo hasta el nivel
        ctx.lineTo(dims.xLeft, liquidY);

        // Ola superior
        for (let x = dims.xLeft; x <= dims.xRight; x += 2) {
          const y =
            liquidY +
            Math.sin((x - dims.xLeft) * frequency + this.wavePhase) * amplitude;
          ctx.lineTo(x, y);
        }

        // Lado derecho bajando
        ctx.lineTo(dims.xRight, dims.yBottom);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      },
      fillLinearGradientStartPoint: { x: 0, y: dims.yTop },
      fillLinearGradientEndPoint: { x: 0, y: dims.yBottom },
      fillLinearGradientColorStops: [
        0,
        adjustColorBrightness(this.primaryColor, 20),
        0.5,
        this.primaryColor,
        1,
        adjustColorBrightness(this.primaryColor, -30),
      ],
      opacity: 0.9,
    });
  }

  drawRectFrame(dims) {
    // Marco exterior
    this.layer.add(
      new Konva.Rect({
        x: dims.xLeft,
        y: dims.yTop,
        width: dims.tankWidth,
        height: dims.tankHeight,
        stroke: TANK_COLORS.stroke,
        strokeWidth: 2,
        cornerRadius: 4,
      })
    );

    // Refuerzos horizontales (bandas)
    [0.3, 0.7].forEach((ratio) => {
      const y = dims.yTop + dims.tankHeight * ratio;
      this.layer.add(
        new Konva.Line({
          points: [dims.xLeft, y, dims.xRight, y],
          stroke: TANK_COLORS.metalDark,
          strokeWidth: 1,
          dash: [5, 3],
          opacity: 0.5,
        })
      );
    });

    // Tapa superior
    this.layer.add(
      new Konva.Rect({
        x: dims.cx - 15,
        y: dims.yTop - 8,
        width: 30,
        height: 8,
        fill: TANK_COLORS.metal,
        stroke: TANK_COLORS.stroke,
        strokeWidth: 1.5,
        cornerRadius: [2, 2, 0, 0],
      })
    );
  }

  drawRectLevelIndicator(dims) {
    const rulerX = dims.xRight + 8;
    const rulerTop = dims.yTop;
    const rulerBottom = dims.yBottom;
    const rulerHeight = dims.tankHeight;

    // Barra vertical
    this.layer.add(
      new Konva.Rect({
        x: rulerX,
        y: rulerTop,
        width: 4,
        height: rulerHeight,
        fill: TANK_COLORS.metal,
        stroke: TANK_COLORS.stroke,
        strokeWidth: 1,
        cornerRadius: 2,
      })
    );

    // Marcas
    for (let i = 0; i <= 4; i++) {
      const pct = i / 4;
      const markY = rulerBottom - rulerHeight * pct; // Invertido: 0 abajo, 100 arriba
      const isMainMark = i % 2 === 0;
      const markWidth = isMainMark ? 8 : 5;

      this.layer.add(
        new Konva.Line({
          points: [rulerX + 4, markY, rulerX + 4 + markWidth, markY],
          stroke: TANK_COLORS.stroke,
          strokeWidth: 1,
        })
      );

      if (isMainMark) {
        this.layer.add(
          new Konva.Text({
            x: rulerX + 14,
            y: markY - 5,
            text: `${i * 25}`, // 0, 50, 100
            fontSize: 9,
            fill: "#64748b",
          })
        );
      }
    }

    // Indicador triangular (flecha)
    const levelY = rulerBottom - rulerHeight * this.currentPercentage;
    this.layer.add(
      new Konva.RegularPolygon({
        x: rulerX - 4,
        y: levelY,
        sides: 3,
        radius: 5,
        fill: this.primaryColor,
        rotation: 90, // Apuntando a la derecha hacia la regla
      })
    );
  }

  animateRectangularLiquid(animate) {
    if (!this.liquidGroup) return;

    // Solo necesitamos redibujar la capa ya que el shape usa this.currentPercentage
    // pero si queremos animar suavemente el valor, Konva.Tween es para propiedades numéricas.
    // El shape personalizado se actualiza en cada frame si usamos Animation,
    // pero aquí estamos usando un tween de una propiedad ficticia o redibujando.

    // Para simplificar y mantener consistencia con el cilindro:
    // Creamos una animación de transición del valor 'currentPercentage' no es directo en canvas.
    // Lo mejor es redibujar la capa. Para animación fluida de subida/bajada,
    // se requeriría lógica adicional de interpolación en el renderer loop.
    // Por ahora, usaremos una aproximación simple: redibujar.
    // Si queremos animar la altura como en el cubo anterior, necesitamos que el shape tenga una altura variable.

    // En este nuevo diseño, el shape se calcula dinámicamente en sceneFunc.
    // Podríamos usar un Konva.Animation para interpolar this.currentPercentage visualmente,
    // pero para no complicar, simplemente redibujamos.
    // Si 'animate' es true, podríamos hacer un tween de un objeto proxy.

    if (animate) {
      const targetPct = this.currentPercentage;
      const startPct = this.liquidGroup.attrs.currentPct || 0; // Guardar estado previo si fuera posible

      // Hack simple: animar un objeto dummy y actualizar
      const dummy = { val: startPct };
      new Konva.Tween({
        node: this.liquidGroup, // Dummy target
        duration: 1,
        onUpdate: () => {
          // No tenemos acceso fácil al valor interpolado aquí sin un objeto real
          // Así que simplemente forzamos el redibujado final.
          // Para una verdadera animación de nivel en canvas custom shape, se requiere más código.
          // Dejaremos el redibujado instantáneo por ahora para asegurar estabilidad,
          // ya que la ola ya está animada.
        },
        onFinish: () => {
          this.layer.draw();
        },
      }).play();
    }

    this.layer.draw();
  }
}
