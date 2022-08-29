import dotenv from 'dotenv'

dotenv.config()

export default {
    api:{
        tiemposession: Number(process.env.TIEMPO_EXPIRACION),
		apisecret: process.env.API_SECRET
    },
	database:{
        dbUrl: process.env.DB_URL
    }
}
