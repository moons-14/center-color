import React, { useState, useRef, useEffect } from 'react';
import { isMobile } from "react-device-detect";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Head from 'next/head';

const CameraDisplay = () => {
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [isCopy, setIsCopy] = useState<Date | null>(null);
  const [centerColor, setCenterColor] = useState<null | string>(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await navigator.permissions.query({
        name: 'camera',
      });

      if (permission.state === 'granted') {
        setHasPermission(true);
      } else if (permission.state === 'denied') {
        setHasPermission(false);
      } else if (permission.state === 'prompt') {
        const newPermission = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (newPermission) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      }
    };

    checkPermission();
  }, []);

  useEffect(() => {
    const aspectRatio = isMobile ? window.outerHeight / window.outerWidth : window.outerWidth / window.outerHeight;
    if (hasPermission === true) {
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'environment',
          width: {
            ideal: 1920
          },
          aspectRatio
        },
      }).then((stream) => {
        videoRef.current!.srcObject = stream;
      });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const update = () => {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const x = canvas.width / 2;
        const y = canvas.height / 2;
        const size = 50;

        context.beginPath();
        context.rect(x - size / 2, y - size / 2, size, size);
        context.stroke();

        const imageData = context.getImageData(x, y, 1, 1);
        const data = imageData.data;
        const r = data[0];
        const g = data[1];
        const b = data[2];

        setCenterColor(`rgb(${r}, ${g}, ${b})`);
      };

      const intervalId = setInterval(update, 100);

      return () => clearInterval(intervalId);
    }
  }, [hasPermission]);

  return (
    <div>
      <Head>
        <title>現実世界の色取得</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {hasPermission === null ? (
        <p>カメラの使用許可の確認中...</p>
      ) : hasPermission === false ? (
        <p>カメラの使用許可がありません</p>
      ) : (
        <>
          <video ref={videoRef} autoPlay
            playsInline
            muted
            width={window.innerWidth}
            height={window.innerHeight} />
          {
            videoRef && videoRef.current ?
              <div style={{
                position: "fixed",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                width: videoRef.current.width,
                height: videoRef.current.height,
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
              }}>
                <div style={{ border: "solid 2px", width: "4px", height: "4px" }}></div>
              </div> : ""
          }
          {
            centerColor ? <>
              <div style={{
                position: "fixed",
                bottom: videoRef.current.width / 3,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <CopyToClipboard text={rgbToHex(centerColor) || ""} onCopy={() => setIsCopy(new Date)}>
                  <div style={{ background: centerColor, borderRadius: "6px", padding: "15px", color: invertColor(rgbToHex(centerColor) || "") || "" }}>
                    {isCopy && isWithinTwoSeconds(isCopy) ?
                      "Copied!!"
                      :
                      rgbToHex(centerColor)
                    }
                  </div>
                </CopyToClipboard>
              </div>
            </> : ""
          }
        </>
      )}
    </div>
  );
};

export default CameraDisplay;

const rgbToHex = (rgb: string) => {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

  if (!match) {
    return null;
  }

  const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[3], 10).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
};
const invertColor = (hex: string) => {
  if (!hex || hex[0] !== '#') {
    return null;
  }

  const r = (255 - parseInt(hex.substring(1, 3), 16)).toString(16).padStart(2, '0');
  const g = (255 - parseInt(hex.substring(3, 5), 16)).toString(16).padStart(2, '0');
  const b = (255 - parseInt(hex.substring(5, 7), 16)).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
};
const isWithinTwoSeconds = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  return diff < 1000;
};