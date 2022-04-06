// based on http://adrianb.io/2014/08/09/perlinnoise.html, https://gist.github.com/Flafla2/f0260a861be0ebdeef76

class Perlin3D {
    constructor(n){
        this.n = n;
        this.permutation = [151,160,137,91,90,15,
            131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
            190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
            88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
            77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
            102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
            135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
            5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
            223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
            129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
            251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
            49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
            138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
        ];
        this.p = new Array(512);
        for(let x = 0; x < 512; x++) this.p[x] = this.permutation[x % 256];
    }
    grad(hash, x, y, z){
        let h = hash & 15;
        let u = h < 8 ? x : y;
        let v;

        if(h < 4) v = y;
        else if(h == 12 || h == 14) v = x;
        else v = z;

        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }
    smootherstep(x){
        return 6*x**5 - 15*x**4 + 10*x**3;
    }
    lerp(a, b, x){
        return a + x * (b-a);
    }
    inc(x){
        x++;
        x %= this.n;
        return x;
    }
    get(x, y, z){
        x %= this.n;
        y %= this.n;
        z %= this.n;

        let xi = Math.floor(x) & 255;
        let yi = Math.floor(y) & 255;
        let zi = Math.floor(z) & 255;

        let xf = x - xi;
        let yf = y - yi;
        let zf = z - zi;

        let hash000 = this.p[this.p[this.p[xi] + yi] + zi];
        let hash001 = this.p[this.p[this.p[xi] + yi] + this.inc(zi)];
        let hash010 = this.p[this.p[this.p[xi] + this.inc(yi)] + zi];
        let hash011 = this.p[this.p[this.p[xi] + this.inc(yi)] + this.inc(zi)];
        let hash100 = this.p[this.p[this.p[this.inc(xi)] + yi] + zi];
        let hash101 = this.p[this.p[this.p[this.inc(xi)] + yi] + this.inc(zi)];
        let hash110 = this.p[this.p[this.p[this.inc(xi)] + this.inc(yi)] + zi];
        let hash111 = this.p[this.p[this.p[this.inc(xi)] + this.inc(yi)] + this.inc(zi)];

        let x1, x2, y1, y2, z1;
        x1 = this.lerp(this.grad(hash000, xf, yf, zf), this.grad(hash100, xf-1, yf, zf), this.smootherstep(xf));
        x2 = this.lerp(this.grad(hash010, xf, yf-1, zf), this.grad(hash110, xf-1, yf-1, zf), this.smootherstep(xf));
        y1 = this.lerp(x1, x2, this.smootherstep(yf));
        
        x1 = this.lerp(this.grad(hash001, xf, yf, zf-1), this.grad(hash101, xf-1, yf, zf-1), this.smootherstep(xf));
        x2 = this.lerp(this.grad(hash011, xf, yf-1, zf-1), this.grad(hash111, xf-1, yf-1, zf-1), this.smootherstep(xf));
        y2 = this.lerp(x1, x2, this.smootherstep(yf));

        z1 = this.lerp(y1, y2, this.smootherstep(zf));
        return z1;
    }
}

class OctavePerlin {
    constructor(n, octaves = 7, persistence = 0.5){
        this.perlin = new Perlin3D(n);
        this.octaves = octaves;
        this.persistence = persistence;
    }
    get(x, y, z){
        let total = 0;
        let maxValue = 0;
        let freq = 1;
        let ampl = 1;

        for(let i = 0; i < this.octaves; i++){
            total += this.perlin.get(x * freq, y * freq, z * freq) * ampl;
            maxValue += ampl;

            freq *= 2;
            ampl *= this.persistence;
        }

        return total / maxValue;
    }
}

export { OctavePerlin };