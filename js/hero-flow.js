(() => {
  const canvases = document.querySelectorAll('.hero-flow-canvas');
  if (!canvases.length) return;

  const assetUrl = new URL('hero-flow.json', document.currentScript.src);
  fetch(assetUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Could not load the hero flow export (${response.status} ${response.statusText}).`);
      }
      return response.json();
    })
    .then((animation) => {
      canvases.forEach((canvas) => {
        try {
          initializeAnimation(animation, canvas);
        } catch (error) {
          console.error('Hero flow animation could not initialize:', error);
        }
      });
    })
    .catch((error) => {
      console.error('Hero flow animation could not load:', error);
    });

  function initializeAnimation(animation, canvas) {
    const hero = canvas.closest('.hero');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationSpeed = canvas.dataset.speed === undefined ? 1 : Number(canvas.dataset.speed);
    if (!Number.isFinite(animationSpeed) || animationSpeed < 0) {
      throw new Error('The hero flow speed must be a non-negative number.');
    }

    if (!Array.isArray(animation.history) || animation.history.length < 2) {
      throw new Error('The hero flow export must contain at least two flattened layers.');
    }

    const webgl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power'
    });
    if (!webgl) {
      throw new Error('Hero flow animation requires WebGL 2, which is not available in this browser.');
    }

    const layers = animation.history.slice(0, 2).map((layer) => ({
      source: layer.compiledFragmentShaders?.[0],
      data: layer.data,
      breakpoints: layer.breakpoints,
      sublayers: layer.sublayers
    }));

    if (layers.some((layer) => typeof layer.source !== 'string')) {
      throw new Error('A flattened hero flow layer is missing its fragment shader.');
    }

    const vertexSource = animation.history[0].compiledVertexShaders?.[0];
    if (!vertexSource) {
      throw new Error('The hero flow export is missing its vertex shader.');
    }

    const createShader = (type, source) => {
      const shader = webgl.createShader(type);
      if (!shader) throw new Error('WebGL could not allocate a shader.');
      webgl.shaderSource(shader, source);
      webgl.compileShader(shader);
      if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
        const message = webgl.getShaderInfoLog(shader);
        webgl.deleteShader(shader);
        throw new Error(`Hero flow shader compilation failed: ${message}`);
      }
      return shader;
    };

    const createProgram = (fragmentSource) => {
      const program = webgl.createProgram();
      if (!program) throw new Error('WebGL could not allocate a shader program.');

      webgl.attachShader(program, createShader(webgl.VERTEX_SHADER, vertexSource));
      webgl.attachShader(program, createShader(webgl.FRAGMENT_SHADER, fragmentSource));
      webgl.linkProgram(program);
      if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
        const message = webgl.getProgramInfoLog(program);
        webgl.deleteProgram(program);
        throw new Error(`Hero flow shader linking failed: ${message}`);
      }
      return program;
    };

    const programs = layers.map((layer) => {
      const program = createProgram(layer.source);
      const uniforms = Object.fromEntries(
        Object.values(layer.data.uniforms).map((uniform) => [
          uniform.name,
          webgl.getUniformLocation(program, uniform.name)
        ])
      );
      uniforms.uSeed = webgl.getUniformLocation(program, 'uSeed');
      return { program, uniforms, layer };
    });

    const vertices = new Float32Array([
      -1, -1, 0, 0, 0,
       1, -1, 0, 1, 0,
      -1,  1, 0, 0, 1,
      -1,  1, 0, 0, 1,
       1, -1, 0, 1, 0,
       1,  1, 0, 1, 1
    ]);
    const vertexBuffer = webgl.createBuffer();
    if (!vertexBuffer) throw new Error('WebGL could not allocate the hero flow vertex buffer.');
    webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);
    webgl.bufferData(webgl.ARRAY_BUFFER, vertices, webgl.STATIC_DRAW);

    const identityMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    const buffers = {
      texture: webgl.createTexture(),
      framebuffer: webgl.createFramebuffer()
    };
    if (!buffers.texture || !buffers.framebuffer) {
      throw new Error('WebGL could not allocate the hero flow render target.');
    }

    webgl.bindTexture(webgl.TEXTURE_2D, buffers.texture);
    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);
    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.LINEAR);
    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
    webgl.texImage2D(
      webgl.TEXTURE_2D,
      0,
      webgl.RGBA,
      1,
      1,
      0,
      webgl.RGBA,
      webgl.UNSIGNED_BYTE,
      null
    );
    webgl.bindFramebuffer(webgl.FRAMEBUFFER, buffers.framebuffer);
    webgl.framebufferTexture2D(
      webgl.FRAMEBUFFER,
      webgl.COLOR_ATTACHMENT0,
      webgl.TEXTURE_2D,
      buffers.texture,
      0
    );
    if (webgl.checkFramebufferStatus(webgl.FRAMEBUFFER) !== webgl.FRAMEBUFFER_COMPLETE) {
      throw new Error('WebGL could not create a complete hero flow render target.');
    }
    webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);

    let width = 0;
    let height = 0;
    let elapsed = 0;
    let previousFrame = 0;
    let animationFrame = null;
    let isVisible = true;
    let isPaused = (hero
      ? hero.classList.contains('is-animation-paused')
      : reducedMotion.matches) || document.documentElement.classList.contains('vfx-disabled');
    const pointer = { x: 0.5, y: 0.5 };
    const pageSeed = {
      _x: Math.random() * 1000,
      _y: Math.random() * 1000
    };

    const setUniform = (location, value) => {
      if (location === null) return;
      if (typeof value === 'number') {
        webgl.uniform1f(location, value);
      } else if (value && Number.isFinite(value._x) && Number.isFinite(value._y)) {
        webgl.uniform2f(location, value._x, value._y);
      }
    };

    const breakpointProps = (layer, viewportWidth) => {
      const breakpoint = layer.breakpoints?.find(({ min, max }) => (
        viewportWidth >= min && (max === null || viewportWidth <= max)
      ));
      return breakpoint?.props ?? {};
    };

    const getLayerTime = (layer) => {
      const animatedUniform = layer.data.timeUniforms?.find(({ animating }) => animating);
      if (animatedUniform) return elapsed * 30 * animatedUniform.speed * animationSpeed;
      return layer.sublayers?.some(({ animating }) => animating) ? elapsed * 6 * animationSpeed : 0;
    };

    const drawLayer = (entry, time, targetFramebuffer, backgroundTexture) => {
      const { program, uniforms, layer } = entry;
      webgl.bindFramebuffer(webgl.FRAMEBUFFER, targetFramebuffer);
      webgl.viewport(0, 0, canvas.width, canvas.height);
      webgl.useProgram(program);
      webgl.bindBuffer(webgl.ARRAY_BUFFER, vertexBuffer);

      const position = webgl.getAttribLocation(program, 'aVertexPosition');
      const textureCoordinate = webgl.getAttribLocation(program, 'aTextureCoord');
      webgl.enableVertexAttribArray(position);
      webgl.vertexAttribPointer(position, 3, webgl.FLOAT, false, 20, 0);
      webgl.enableVertexAttribArray(textureCoordinate);
      webgl.vertexAttribPointer(textureCoordinate, 2, webgl.FLOAT, false, 20, 12);

      const modelView = webgl.getUniformLocation(program, 'uMVMatrix');
      const projection = webgl.getUniformLocation(program, 'uPMatrix');
      if (modelView !== null) webgl.uniformMatrix4fv(modelView, false, identityMatrix);
      if (projection !== null) webgl.uniformMatrix4fv(projection, false, identityMatrix);

      const baseUniforms = Object.values(layer.data.uniforms);
      const overrides = breakpointProps(layer, window.innerWidth);
      for (const [key, uniform] of Object.entries(layer.data.uniforms)) {
        const value = Object.prototype.hasOwnProperty.call(overrides, key)
          ? overrides[key]
          : uniform.value;
        setUniform(uniforms[uniform.name], value);
      }

      setUniform(uniforms.uResolution, { _x: width, _y: height });
      setUniform(uniforms.uMousePos, pointer);
      setUniform(uniforms.uL0_MousePos, pointer);
      setUniform(uniforms.uL1_Time, getLayerTime(layer));
      setUniform(uniforms.uSeed, pageSeed);

      if (backgroundTexture) {
        webgl.activeTexture(webgl.TEXTURE0);
        webgl.bindTexture(webgl.TEXTURE_2D, backgroundTexture);
        const backgroundUniform = uniforms.uBgTexture;
        if (backgroundUniform !== null && backgroundUniform !== undefined) {
          webgl.uniform1i(backgroundUniform, 0);
        }
      }

      if (baseUniforms.length) webgl.drawArrays(webgl.TRIANGLES, 0, 6);
    };

    const draw = () => {
      drawLayer(programs[0], elapsed, buffers.framebuffer, null);
      drawLayer(programs[1], elapsed, null, buffers.texture);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        animation.options?.dpi ?? 1,
        animation.options?.scale ?? 1,
        Math.sqrt(2_000_000 / (width * height))
      );
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));

      webgl.bindTexture(webgl.TEXTURE_2D, buffers.texture);
      webgl.texImage2D(
        webgl.TEXTURE_2D,
        0,
        webgl.RGBA,
        canvas.width,
        canvas.height,
        0,
        webgl.RGBA,
        webgl.UNSIGNED_BYTE,
        null
      );
      webgl.bindFramebuffer(webgl.FRAMEBUFFER, buffers.framebuffer);
      webgl.framebufferTexture2D(
        webgl.FRAMEBUFFER,
        webgl.COLOR_ATTACHMENT0,
        webgl.TEXTURE_2D,
        buffers.texture,
        0
      );
      webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);
      draw();
    };

    const shouldAnimate = () => !isPaused && isVisible && !document.hidden;
    const stop = () => {
      if (animationFrame === null) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
      previousFrame = 0;
    };

    const renderFrame = (timestamp) => {
      animationFrame = null;
      if (!shouldAnimate()) return;
      if (previousFrame) elapsed += Math.min((timestamp - previousFrame) / 1000, 0.05);
      previousFrame = timestamp;
      draw();
      animationFrame = window.requestAnimationFrame(renderFrame);
    };

    const updateAnimation = () => {
      if (shouldAnimate()) {
        if (animationFrame === null) animationFrame = window.requestAnimationFrame(renderFrame);
      } else {
        stop();
      }
    };

    const updatePause = () => {
      isPaused = (hero
        ? hero.classList.contains('is-animation-paused')
        : reducedMotion.matches) || document.documentElement.classList.contains('vfx-disabled');
      updateAnimation();
    };

    canvas.addEventListener('pointermove', (event) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - bounds.left) / bounds.width;
      pointer.y = 1 - (event.clientY - bounds.top) / bounds.height;
    }, { passive: true });

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', updateAnimation);
    document.addEventListener('aw3ry:preferences-changed', updatePause);
    reducedMotion.addEventListener('change', updatePause);
    if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas);
    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        updateAnimation();
      }).observe(canvas);
    }
    if (hero && typeof MutationObserver === 'function') {
      new MutationObserver(updatePause).observe(hero, { attributes: true, attributeFilter: ['class'] });
    }

    resize();
    updateAnimation();
  }
})();
