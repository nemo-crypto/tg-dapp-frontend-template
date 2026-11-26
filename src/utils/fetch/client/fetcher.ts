"use client"

export type ResponseData = {
  result: any
  msg: string
  success: boolean
  err: string
  params?: string[]
  data?: any
}

export type ClientResponse = {
  status: number
  json: ResponseData
  body?: string
}
// 保留最近一次成功刷新结果，让较晚返回的过期请求也复用同一轮刷新。
let latestRefresh: {token: string; promise: Promise<ClientResponse>} | null = null
function refreshAccessToken(refreshToken: string): Promise<ClientResponse> {
  if (latestRefresh?.token === refreshToken) return latestRefresh.promise
  const promise = send("/api/service", getOptions("POST", "user_refreshToken", {refreshToken})).then(response => {
    const result = response.json.result
    const data = result?.data
    const valid = response.status === 200 && result?.code === 0 &&
      typeof data?.token === "string" && data.token.length > 0 &&
      typeof data?.refreshToken === "string" && data.refreshToken.length > 0
    // 请求期间退出或切换账号，旧响应不能恢复或清除新会话。
    if (localStorage.getItem("refreshToken") === refreshToken) {
      if (valid) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("refreshToken", data.refreshToken)
        if (data.refreshTokenExpireAt != null) localStorage.setItem("refreshTokenExpireAt", data.refreshTokenExpireAt)
        else localStorage.removeItem("refreshTokenExpireAt")
      } else if (response.status === 200 && result?.code === 10102) {
        localStorage.removeItem("token")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("refreshTokenExpireAt")
      }
    }
    if (!valid && latestRefresh?.promise === promise) latestRefresh = null
    return response
  }).catch(error => {
    if (latestRefresh?.promise === promise) latestRefresh = null
    throw error
  })
  latestRefresh = {token: refreshToken, promise}
  return promise
}

const fetcher = {
  get(path: string, data: any = null) {
    return this.request("GET", path, data)
  },

  post(path: string, data?: any, token?: string) {
    return this.request("POST", path, data, token)
  },

  put(path: string, data: any, token?: string) {
    return this.request("PUT", path, data)
  },

  delete(path: string, data: any, token?: string) {
    return this.request("DELETE", path, data)
  },

  patch(path: string, data: any, token?: string) {
    return this.request("PATCH", path, data)
  },

  head(path: string, data: any = null, token?: string) {
    return this.request("HEAD", path, data)
  },

  async request(
    method: string,
    path: string,
    data: any = null,
    token?: string,
  ) {
    const tokenStr = localStorage.getItem("token") as string
    const refreshTokenStr = localStorage.getItem("refreshToken") as string
    let res
    if (path == "user_login") {
      const options = getOptions(method, path, data, "tma " + token)
      res = await send("/api/session", options)
    } else {
      const options = getOptions(method, path, data, "Bearer " + tokenStr)
      res = await send("/api/service", options)
    }
    if (res.status === 200 && res.json.result?.code === 10101 && refreshTokenStr) {
      const resToken = await refreshAccessToken(refreshTokenStr)
      const renewed = resToken.json.result?.data
      if (resToken.status === 200 && resToken.json.result?.code === 0 &&
        typeof renewed?.token === "string" && renewed.token.length > 0 &&
        typeof renewed?.refreshToken === "string" && renewed.refreshToken.length > 0 &&
        localStorage.getItem("token") === renewed.token &&
        localStorage.getItem("refreshToken") === renewed.refreshToken) {
        res = await send("/api/service", getOptions(method, path, data, "Bearer " + renewed.token))
      } else if (resToken.status === 200 && resToken.json.result?.code === 10102) {
        res = resToken
      }
    }
    return res
  },
}
function getOptions(
  method: string,
  path: string,
  data: any = null,
  token?: string,
) {
  const options: RequestInit = {
    method: "POST",
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  }

  options.body = JSON.stringify({ method, path, data, token })

  return options
}

async function send(
  url: string,
  options: RequestInit,
  callback: (res: Response) => void = () => void 0,
) {
  try {
    const res = await fetch(url, options)

    const ret: ClientResponse = {
      status: res.status,
      json: {
        err: "unknownError",
        msg: "",
        success: false,
        result: undefined,
      },
    }

    const body = await res.text()
    if (body) {
      try {
        const parsed: unknown = JSON.parse(body)
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          ret.body = body
        } else {
          ret.json = parsed as ResponseData
          callback(res)
        }
      } catch (e) {
        ret.body = body
      }
    }
    return ret
  } catch (e) {
    return catchError(e)
  }
}

function catchError(e: any) {
  console.error(e)
  return {
    status: 599,
    json: {
      err: "networkError",
    },
    body: `${e}`,
  } as ClientResponse
}

export default fetcher
