//const api_url = 'http://0.0.0.0:5000/api/'
const api_url = '/api/'
//'register', 'login', 'forgot_password', 'show_notes', 'show_note', 'add_note', 'edit_note', 'remove_note', 'show_profile', 'edit_profile', 'remove_user', 'get_sync_stamp'
class Api{
    static async api(name, req={}, retry=true) {
        do{
            try {
                var response = await fetch(api_url+name, {
                    method: 'POST',
                    credentials: "include",
                    body: JSON.stringify(req)
                })
            }
            catch (e) {
                continue
            }
            break
        }while (true);
        let res = await response.json()
        if (res.status === 3 && res.response === "Сессия недействительна."){
            this.logout()
            document.location.reload()
        } else if (res.status === 2){
            this.setCookie('session',res.response,"SameSite=None")
            document.location.reload()
        }
        return res
    }
    static logout(){
        window.location.href = '/#/login'
        this.deleteCookie('session')
        localStorage.removeItem('notes')
        localStorage.removeItem('sync_stamp')
        document.location.reload()
    }
    static getCookie(name) {
        let matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + "=([^;]*)"))
        return matches ? decodeURIComponent(matches[1]) : ""
    }
    static setCookie(name, value, options = {}) {
        options = {path: '/', ...options}
        if (options.expires instanceof Date) {
            options.expires = options.expires.toUTCString()
        }
        let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value)
        for (let optionKey in options) {
            updatedCookie += "; " + optionKey
            let optionValue = options[optionKey]
            if (optionValue !== true) {
                updatedCookie += "=" + optionValue
            }
        }
        document.cookie = updatedCookie
    }
    static deleteCookie(name) {
        this.setCookie(name, "", {'max-age': -1})
    }
}
export default Api
