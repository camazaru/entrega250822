let NumerosRandom = []


const generateRandomNumber = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

function ProcesarRandoms(cant){
    
    for(let i=1; i<=cant; i++)
    {
        let existeNumero = 0
        let NumeroGenerado = generateRandomNumber(1,1000)

        if(NumerosRandom.length == 0){
            NumerosRandom.push({
                random: NumeroGenerado,
                cantidad: 1
            })
        }

        else{
            existeNumero = NumerosRandom?.filter(numero => {
                return numero.random === NumeroGenerado
            })
            //console.log(existeNumero.length,":", NumeroGenerado)
            if(existeNumero.length == 0)
            {
                NumerosRandom.push({
                    random: NumeroGenerado,
                    cantidad: 1
                })
            }
            else{
                const indexDatos = NumerosRandom.findIndex(object => {
                    return object.random === NumeroGenerado;
                });
                NumerosRandom[indexDatos].cantidad = NumerosRandom[indexDatos].cantidad+1
            }
        }
    
    }
    return NumerosRandom
}


process.on("message", (msg) => {
    const suma = ProcesarRandoms(msg);
  
    process.send(suma);
  });

