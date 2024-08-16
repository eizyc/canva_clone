import { fabric } from "fabric";
import { useCallback, useEffect } from "react";
import { WORKSPACE_NAME } from "../const";
import { cn } from "@/lib/utils";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
}

export const useAutoResize = ({ canvas, container }: UseAutoResizeProps) => {
  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    canvas.setWidth(width);
    canvas.setHeight(height);

    const center = canvas.getCenter();

    const zoomRatio = 0.85;
    const localWorkspace = canvas
      .getObjects()
      .find((object) => object.name === WORKSPACE_NAME);

    // http://fabricjs.com/docs/fabric.util.html#.findScaleToFit 
    // @ts-ignore
    const scale = fabric.util.findScaleToFit(localWorkspace, {
      width,
      height,
    });

    const zoom = zoomRatio * scale;

    // identity matrix  [1, 0, 0, 1, 0, 0]
    canvas.setViewportTransform(fabric.iMatrix.concat());
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);
    // the viewportTransform is updated, not more [1, 0, 0, 1, 0, 0]

    if (!localWorkspace) return;

    // get the center of the workspace in the object in canvas coordinate.
    const workspaceCenter = localWorkspace.getCenterPoint();

    console.log(canvas.height, canvas.width, workspaceCenter);

    // 6 numbers that represents a 2D transformation matrix
    // [horizontal scaling, vertical skewing, horizontal skewing, vertical scaling, horizontal translation, vertical translation]
    const viewportTransform = canvas.viewportTransform?.concat();

    if (
      canvas.width === undefined ||
      canvas.height === undefined ||
      !viewportTransform
    ) {
      return;
    }


    // base on the center of the workspace in canvas coordinates
    viewportTransform[4] = canvas.width / 2 - workspaceCenter.x * viewportTransform[0];

    viewportTransform[5] = canvas.height / 2 - workspaceCenter.y * viewportTransform[3];

    canvas.setViewportTransform(viewportTransform);

    localWorkspace.clone((cloned: fabric.Rect) => {
      canvas.clipPath = cloned;
      canvas.requestRenderAll();
    });
  }, [canvas, container]);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;

    if (canvas && container) {
      resizeObserver = new ResizeObserver(() => {
        autoZoom();
      });

      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvas, container, autoZoom]);

  return { autoZoom };
};
