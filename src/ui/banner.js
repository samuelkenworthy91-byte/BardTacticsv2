export function fitImageToBounds(scene, image, textureKey, maxWidth, maxHeight, cover = false) {
  if (!scene?.textures?.exists(textureKey) || !image) return;
  const source = scene.textures.get(textureKey)?.getSourceImage();
  if (!source?.width || !source?.height) return;
  const scale = cover
    ? Math.max(maxWidth / source.width, maxHeight / source.height)
    : Math.min(maxWidth / source.width, maxHeight / source.height);
  image.setDisplaySize(source.width * scale, source.height * scale);
}

export function createBannerPanel(scene, x, y, width, height, options = {}) {
  const container = scene.add.container(x, y);
  const shadowOffset = options.shadowOffset ?? 5;
  const shadow = scene.add.rectangle(shadowOffset, shadowOffset, width, height, 0x000000, options.shadowAlpha ?? 0.34).setOrigin(0.5);
  const outer = scene.add.rectangle(0, 0, width, height, options.outerColor ?? 0x14091f, options.outerAlpha ?? 0.97).setOrigin(0.5);
  outer.setStrokeStyle(options.outerStrokeWidth ?? 3, options.outerStrokeColor ?? 0xb6925f, 1);
  const inner = scene.add.rectangle(0, 0, width - (options.innerInset ?? 14), height - (options.innerInset ?? 14), options.innerColor ?? 0x29133f, options.innerAlpha ?? 0.98).setOrigin(0.5);
  inner.setStrokeStyle(options.innerStrokeWidth ?? 1, options.innerStrokeColor ?? 0xe4d0a8, options.innerStrokeAlpha ?? 0.82);
  container.add([shadow, outer, inner]);
  return { container, shadow, outer, inner };
}

export function createBannerButton(scene, x, y, width, height, label, onClick, fontSize = "22px") {
  const container = scene.add.container(x, y);
  const shadow = scene.add.rectangle(4, 4, width, height, 0x000000, 0.34).setOrigin(0.5);
  const outer = scene.add.rectangle(0, 0, width, height, 0x1a0d2a, 0.98).setOrigin(0.5);
  outer.setStrokeStyle(2, 0xb6925f, 1);
  const inner = scene.add.rectangle(0, 0, width - 10, height - 10, 0x412164, 0.98).setOrigin(0.5);
  inner.setStrokeStyle(1, 0xe4d0a8, 0.78);
  const text = scene.add.text(0, 0, label, {
    fontSize,
    fontStyle: "bold",
    color: "#f7ecd3",
    stroke: "#0b0811",
    strokeThickness: 3,
  }).setOrigin(0.5);
  const hit = scene.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0.5);
  hit.setInteractive({ useHandCursor: true });
  hit.on("pointerover", () => {
    inner.setFillStyle(0x573487, 0.99);
    outer.setStrokeStyle(2, 0xe0c186, 1);
    container.y = y - 1;
  });
  hit.on("pointerout", () => {
    inner.setFillStyle(0x412164, 0.98);
    outer.setStrokeStyle(2, 0xb6925f, 1);
    container.y = y;
  });
  hit.on("pointerdown", (pointer, localX, localY, event) => {
    if (event?.stopPropagation) event.stopPropagation();
    if (typeof onClick === "function") onClick();
  });
  container.add([shadow, outer, inner, text, hit]);
  return { container, shadow, outer, inner, text, hit };
}
