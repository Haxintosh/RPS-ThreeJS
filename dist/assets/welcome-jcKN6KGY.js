import{j as ne,L as ie,F as ae,k as oe,P as re,V as H,M as se,l as le,m as j,N,H as q,D as de,n as he,o as ce,S as ue,a as me,W as ge,E as fe,G as pe,C as we,O as xe,g as ve,B as W,p as A,q as B,r as p,d as be,e as ye,s as Se,T as V,h as J,u as Ee,R as K}from"./OutputPass-DWthg8VV.js";class T extends ne{constructor(e,t={}){const n=t.font;if(n===void 0)super();else{const a=n.generateShapes(e,t.size);t.depth=t.height!==void 0?t.height:50,t.bevelThickness===void 0&&(t.bevelThickness=10),t.bevelSize===void 0&&(t.bevelSize=8),t.bevelEnabled===void 0&&(t.bevelEnabled=!1),super(a,t)}this.type="TextGeometry"}}class Te extends ie{constructor(e){super(e)}load(e,t,n,a){const s=this,l=new ae(this.manager);l.setPath(this.path),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(h){const c=s.parse(JSON.parse(h));t&&t(c)},n,a)}parse(e){return new ze(e)}}class ze{constructor(e){this.isFont=!0,this.type="Font",this.data=e}generateShapes(e,t=100){const n=[],a=Me(e,t,this.data);for(let s=0,l=a.length;s<l;s++)n.push(...a[s].toShapes());return n}}function Me(i,e,t){const n=Array.from(i),a=e/t.resolution,s=(t.boundingBox.yMax-t.boundingBox.yMin+t.underlineThickness)*a,l=[];let h=0,c=0;for(let u=0;u<n.length;u++){const m=n[u];if(m===`
`)h=0,c-=s;else{const g=Re(m,a,h,c,t);h+=g.offsetX,l.push(g.path)}}return l}function Re(i,e,t,n,a){const s=a.glyphs[i]||a.glyphs["?"];if(!s){console.error('THREE.Font: character "'+i+'" does not exists in font family '+a.familyName+".");return}const l=new oe;let h,c,u,m,g,x,L,I;if(s.o){const o=s._cachedOutline||(s._cachedOutline=s.o.split(" "));for(let r=0,S=o.length;r<S;)switch(o[r++]){case"m":h=o[r++]*e+t,c=o[r++]*e+n,l.moveTo(h,c);break;case"l":h=o[r++]*e+t,c=o[r++]*e+n,l.lineTo(h,c);break;case"q":u=o[r++]*e+t,m=o[r++]*e+n,g=o[r++]*e+t,x=o[r++]*e+n,l.quadraticCurveTo(g,x,u,m);break;case"b":u=o[r++]*e+t,m=o[r++]*e+n,g=o[r++]*e+t,x=o[r++]*e+n,L=o[r++]*e+t,I=o[r++]*e+n,l.bezierCurveTo(g,x,L,I,u,m);break}}return{offsetX:s.ha*e,path:l}}class De extends re{constructor(e,t,n,a={}){super(),this.pixelSize=e,this.resolution=new H,this.renderResolution=new H,this.pixelatedMaterial=this.createPixelatedMaterial(),this.normalMaterial=new se,this.fsQuad=new le(this.pixelatedMaterial),this.scene=t,this.camera=n,this.normalEdgeStrength=a.normalEdgeStrength||.3,this.depthEdgeStrength=a.depthEdgeStrength||.4,this.beautyRenderTarget=new j,this.beautyRenderTarget.texture.minFilter=N,this.beautyRenderTarget.texture.magFilter=N,this.beautyRenderTarget.texture.type=q,this.beautyRenderTarget.depthTexture=new de,this.normalRenderTarget=new j,this.normalRenderTarget.texture.minFilter=N,this.normalRenderTarget.texture.magFilter=N,this.normalRenderTarget.texture.type=q}dispose(){this.beautyRenderTarget.dispose(),this.normalRenderTarget.dispose(),this.pixelatedMaterial.dispose(),this.normalMaterial.dispose(),this.fsQuad.dispose()}setSize(e,t){this.resolution.set(e,t),this.renderResolution.set(e/this.pixelSize|0,t/this.pixelSize|0);const{x:n,y:a}=this.renderResolution;this.beautyRenderTarget.setSize(n,a),this.normalRenderTarget.setSize(n,a),this.fsQuad.material.uniforms.resolution.value.set(n,a,1/n,1/a)}setPixelSize(e){this.pixelSize=e,this.setSize(this.resolution.x,this.resolution.y)}render(e,t){const n=this.fsQuad.material.uniforms;n.normalEdgeStrength.value=this.normalEdgeStrength,n.depthEdgeStrength.value=this.depthEdgeStrength,e.setRenderTarget(this.beautyRenderTarget),e.render(this.scene,this.camera);const a=this.scene.overrideMaterial;e.setRenderTarget(this.normalRenderTarget),this.scene.overrideMaterial=this.normalMaterial,e.render(this.scene,this.camera),this.scene.overrideMaterial=a,n.tDiffuse.value=this.beautyRenderTarget.texture,n.tDepth.value=this.beautyRenderTarget.depthTexture,n.tNormal.value=this.normalRenderTarget.texture,this.renderToScreen?e.setRenderTarget(null):(e.setRenderTarget(t),this.clear&&e.clear()),this.fsQuad.render(e)}createPixelatedMaterial(){return new he({uniforms:{tDiffuse:{value:null},tDepth:{value:null},tNormal:{value:null},resolution:{value:new ce(this.renderResolution.x,this.renderResolution.y,1/this.renderResolution.x,1/this.renderResolution.y)},normalEdgeStrength:{value:0},depthEdgeStrength:{value:0}},vertexShader:`
				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`
				uniform sampler2D tDiffuse;
				uniform sampler2D tDepth;
				uniform sampler2D tNormal;
				uniform vec4 resolution;
				uniform float normalEdgeStrength;
				uniform float depthEdgeStrength;
				varying vec2 vUv;

				float getDepth(int x, int y) {

					return texture2D( tDepth, vUv + vec2(x, y) * resolution.zw ).r;

				}

				vec3 getNormal(int x, int y) {

					return texture2D( tNormal, vUv + vec2(x, y) * resolution.zw ).rgb * 2.0 - 1.0;

				}

				float depthEdgeIndicator(float depth, vec3 normal) {

					float diff = 0.0;
					diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
					diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
					diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
					diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
					return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;

				}

				float neighborNormalEdgeIndicator(int x, int y, float depth, vec3 normal) {

					float depthDiff = getDepth(x, y) - depth;
					vec3 neighborNormal = getNormal(x, y);

					// Edge pixels should yield to faces who's normals are closer to the bias normal.
					vec3 normalEdgeBias = vec3(1., 1., 1.); // This should probably be a parameter.
					float normalDiff = dot(normal - neighborNormal, normalEdgeBias);
					float normalIndicator = clamp(smoothstep(-.01, .01, normalDiff), 0.0, 1.0);

					// Only the shallower pixel should detect the normal edge.
					float depthIndicator = clamp(sign(depthDiff * .25 + .0025), 0.0, 1.0);

					return (1.0 - dot(normal, neighborNormal)) * depthIndicator * normalIndicator;

				}

				float normalEdgeIndicator(float depth, vec3 normal) {

					float indicator = 0.0;

					indicator += neighborNormalEdgeIndicator(0, -1, depth, normal);
					indicator += neighborNormalEdgeIndicator(0, 1, depth, normal);
					indicator += neighborNormalEdgeIndicator(-1, 0, depth, normal);
					indicator += neighborNormalEdgeIndicator(1, 0, depth, normal);

					return step(0.1, indicator);

				}

				void main() {

					vec4 texel = texture2D( tDiffuse, vUv );

					float depth = 0.0;
					vec3 normal = vec3(0.0);

					if (depthEdgeStrength > 0.0 || normalEdgeStrength > 0.0) {

						depth = getDepth(0, 0);
						normal = getNormal(0, 0);

					}

					float dei = 0.0;
					if (depthEdgeStrength > 0.0)
						dei = depthEdgeIndicator(depth, normal);

					float nei = 0.0;
					if (normalEdgeStrength > 0.0)
						nei = normalEdgeIndicator(depth, normal);

					float Strength = dei > 0.0 ? (1.0 - depthEdgeStrength * dei) : (1.0 + normalEdgeStrength * nei);

					gl_FragColor = texel * Strength;

				}
			`})}}const{innerWidth:Z,innerHeight:$}=window,d=new ue,f=new me(75,Z/$,.1,1e3),b=new ge({canvas:document.querySelector("#canvas")}),y=new fe(b);new pe;let k=new H,G={x:329.1184433897465,y:-143.55820963544724,z:344.70554127267064},U={x:-3100,y:1400,z:-9400};d.background=new we(16435352);b.setPixelRatio(window.devicePixelRatio);b.setSize(window.innerWidth,window.innerHeight);b.shadowMap.enabled=!0;y.setSize(Z,$);f.position.set(G.x,G.y,G.z);f.lookAt(U.x,U.y,U.z);f.zoom=1;let Pe=new Te;Pe.load("/fonts/kroeger 05_55_Regular.json",function(i){console.log(i),console.log("loaded"),Le(i)},function(i){console.log(i.loaded/i.total*100+"% loaded")},function(i){console.log("An error happened")});const X=new De(3,d,f);y.addPass(X);const Q=new xe(new H(window.innerWidth,window.innerHeight),d,f);y.addPass(Q);Q.edgeStrength=10;const Fe=new ve;y.addPass(Fe);let z,M,R,D,P,F,v;function Le(i){let e=125,t=40,n=20,a=new T("WELCOME!",{font:i,size:50,height:30,curveSegments:1,bevelEnabled:!1,bevelThickness:4,bevelSize:4,bevelOffset:0,bevelSegments:5}),s=new T("SELECT DIFFICULTY",{font:i,size:25,height:20,curveSegments:1,bevelEnabled:!1}),l=new T("EASY",{font:i,size:25,height:10,curveSegments:1,bevelEnabled:!1}),h=new T("MEDIUM",{font:i,size:25,height:10,curveSegments:1,bevelEnabled:!1}),c=new T("IMPOSSIBLE",{font:i,size:25,height:10,curveSegments:1,bevelEnabled:!1}),u=new W(e,t,n),m=new W(e,t,n),g=new W(e,t,n);a.computeBoundingBox(),s.computeBoundingBox();let x=new A({color:6862825,emissive:5209739,shininess:10,specular:16777215}),L=new A({color:1842308,emissive:5209739,shininess:10,specular:16777215}),I=new B({color:5294200}),o=new B({color:16769144}),r=new B({color:13770556}),S=new B({color:16777215});v=new p(a,x),v.receiveShadow=!0,v.castShadow=!0,d.add(v);let E=new p(s,L);E.receiveShadow=!0,E.castShadow=!0,d.add(E),z=new p(u,I),M=new p(m,o),R=new p(g,r),D=new p(l,S),P=new p(h,S),F=new p(c,S),D.name="easy",P.name="medium",F.name="hard",z.name="easy",M.name="medium",R.name="hard",d.add(D),d.add(P),d.add(F),d.add(z),d.add(M),d.add(R),z.position.set(125,-115,0),M.position.set(125,-165,0),R.position.set(125,-215,0),D.position.set(125+e-20,-115-t/4,0),P.position.set(125+e-20,-165-t/4,0),F.position.set(125+e-20,-215-t/4,0),E.position.set(150,-60,0);let ee=new be(16777215,1.5);d.add(ee);let C=new ye(16777215,5e6*1.2);C.position.set(500,1e3,75),d.add(C);let te=new Se(C);d.add(te),X.depthEdgeStrength=1;let O=new V({x:0,y:0,z:0}).to({x:0,y:0,z:20},4e3).easing(J.Quadratic.InOut).onUpdate(function(w){v.position.set(w.x,w.y,w.z)}),_=new V({x:0,y:0,z:20}).to({x:0,y:0,z:0},4e3).easing(J.Quadratic.InOut).onUpdate(function(w){v.position.set(w.x,w.y,w.z)});O.chain(_),_.chain(O),O.start(),Y()}addEventListener("resize",()=>{b.setPixelRatio(window.devicePixelRatio),b.setSize(window.innerWidth,window.innerHeight),f.aspect=window.innerWidth/window.innerHeight,f.updateProjectionMatrix(),y.setSize(window.innerWidth,window.innerHeight)});addEventListener("mousemove",Ie);addEventListener("click",Be);function Ie(i){k.x=i.clientX/window.innerWidth*2-1,k.y=-(i.clientY/window.innerHeight)*2+1}function Y(){requestAnimationFrame(Y),Ne(),Ee(),y.render()}function Ne(){let i=new K;i.setFromCamera(k,f);let e=i.intersectObjects(d.children,!0);if(e.length>0){let t=e[0].object;(t.name==="easy"||t.name==="medium"||t.name==="hard")&&(Q.selectedObjects=[t],t.position.z=-10)}else z.position.z=0,M.position.z=0,R.position.z=0,D.position.z=0,P.position.z=0,F.position.z=0}function Be(){let i=new K;i.setFromCamera(k,f);let e=i.intersectObjects(d.children,!0);if(e.length>0){let t=e[0].object;if(t.name==="easy"||t.name==="medium"||t.name==="hard"){console.log(t.name);let n="/game/game.html";switch(t.name){case"easy":n+="?difficulty=easy";break;case"medium":n+="?difficulty=medium";break;case"hard":n+="?difficulty=hard";break}console.log(n),window.location.replace(n)}}}
