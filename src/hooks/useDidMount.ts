import { useEffect, useState } from "react"

export function useDidMount(): boolean {
  const [didMount, setDidMount] = useState(false)

  useEffect(() => {
    setDidMount(true)
  }, [])

  return didMount
}
