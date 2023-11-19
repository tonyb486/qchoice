
class QChooser {
    
    // Start with an empty entropy pool
    constructor() {
        this.randPool = []
        this.updated = false;
    }

    // Update the pool from the qrng.anu.edu.au API
    async updatePool() {

        this.randPool = []

        var count = 0;
        var maxTries = 10;

        // This might take some retries, the API is limited to once per 60 seconds
        // We'll pull 100 bytes at a time, realistically this should be plenty
        while( this.randPool.length == 0) {

            try {
                console.log("Refreshing entropy pool...")
                const randData = await fetch("https://qrng.anu.edu.au/API/jsonI.php?length=100&type=uint8")
                this.randPool = (await randData.json())["data"]
                this.updated = Date.now()
                console.log("Pool Updated!")
            } catch (e) {
                console.log("Error: "+e.message)
                console.log("Waiting 61 seconds....")

                this.randPool = []
                if (++count == maxTries) throw e;

                // Wait 61 seconds, try again
                await new Promise(r => setTimeout(r, 61000));
            }

        }

    }

    // Generate a random byte
    async randi8() {

        // Update entropy pool if it's empty
        if ( this.randPool.length == 0 ) 
            await this.updatePool();

        // Pull a random byte out of it
        return this.randPool.pop();

    }

    // Generate a random byte from [0-n) open interval
    async randi8n(n) {

        // We're limiting this to 8-bit numbers
        if (n > 255) 
            throw new Error("Only generating bytes (0-255).")

        // Make sure that we're only using bytes from 0 to
        // a number divisible by n
        const m = 256-256%n;

        // Pull random numbers, keep it lower than or equal to m
        var randByte = 257;
        while (randByte >= m)
            randByte = await this.randi8()

        // We can safely modulo by n now
        return randByte%n

    }
    
    // Pick a random element from a list, pick your destiny
    async choice(L) {
        return L[await this.randi8n(L.length)]
    }

}

module.exports = QChooser

