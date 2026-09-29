import axios from 'axios'
import runtimeEnv from './runtimeEnv'

axios.defaults.baseURL = runtimeEnv.VITE_STORAGE_SERVICE_API_URL

export default axios
