const ping = require("ping")
const { exec } = require("child_process")
const network = require('network')

function main(){
    //hora de busca pelo dispositívos
    let time = new Date()
    let hour = time.getHours()
    let min = time.getMinutes()
    let sec = time.getSeconds()
    let completTime = `${hour}:${min}:${sec}`
    console.log(`|--------------------|`)
    console.log(`|------${completTime}-------|`)
    console.log(`|--------------------|`)
    network.get_active_interface(function(err, activeInterface) {

    /////////////////////////////////////////////////////////////////
    //                     C O N V E R Ç Ã O                       //
    /////////////////////////////////////////////////////////////////

    //passa ip para binário
    function ipToBinary(ipv4) {
        return ipv4.split('.').map(part => parseInt(part, 10).toString(2).padStart(8, '0')).join('.')
    }
    
    //Cálculo para descobrir sub-rede
    function calculateSubnet(ipv4, subnetMask) {
        const ipv4Binary = ipToBinary(ipv4)
        const subnetMaskBinary = ipToBinary(subnetMask)
        const subnetBinary = ipv4Binary.split('.').map((part, index) => {
            return (parseInt(part, 2) & parseInt(subnetMaskBinary.split('.')[index], 2)).toString(2).padStart(8, '0')
        }).join('.')
        return subnetBinary.split('.').map(part => parseInt(part, 2)).join('.')
    }
    
    //deixa a sub-rede no formato certo
    const ipv4Address = activeInterface.ip_address
    const subnetMask = activeInterface.netmask
    const subNet = calculateSubnet(ipv4Address, subnetMask)
    let trimmedSubnet = subNet.replace(/\.0$/, '')

    /////////////////////////////////////////////////////////////////
    //                   V E R I F I C A Ç Ã O                     //
    /////////////////////////////////////////////////////////////////

    const subnet = trimmedSubnet // Sub-rede do seu Wi-Fi
    const startIp = 1 // primeiro octeto do intervalo de IP a ser verificado
    const endIp = 254 // último octeto do intervalo de IP a ser verificado

    async function countConnectedDevices() {

        for (let i = startIp; i <= endIp; i++) {

            const host = `${subnet}.${i}`

            await ping.promise.probe(host)
                .then(async (result) => {
                    if (result.alive) {
                        getMacAddress(host, (macAddress) => {
                            console.log(`Dispositivo conectado: ${host}, Endereço MAC: ${macAddress}`)
                        })
                    }
                })
                .catch((error) => {
                    console.error(`Erro ao pingar o host ${host}: ${error}`)
                })
        }
    }

    function getMacAddress(ip, callback) {
        exec(`arp -a ${ip}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao executar comando arp para ${ip}: ${error.message}`)
                return
            }
            const matches = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g)
            const macAddress = matches ? matches[0] : 'Não encontrado'
            callback(macAddress)
        })
    }

    countConnectedDevices()
        
    })

}

// inicia/reinicia a operação
main()
setInterval(main, 120000);