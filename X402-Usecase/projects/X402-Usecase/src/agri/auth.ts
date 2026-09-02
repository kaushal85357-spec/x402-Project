export type UserRole = 'Farmer' | 'Consumer'

export interface AgriUser {
  name: string
  password: string
  role: UserRole
}

const USERS_KEY = 'agriprocure_users'
const SESSION_KEY = 'agriprocure_session'

function readUsers(): AgriUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as AgriUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: AgriUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getSession(): AgriUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as AgriUser) : null
  } catch {
    return null
  }
}

export function login(name: string, password: string): AgriUser {
  const users = readUsers()
  const match = users.find(
    (u) => u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password,
  )
  if (!match) {
    throw new Error('Name or password is incorrect. Register if you are a new user.')
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(match))
  return match
}

export function register(name: string, password: string, role: UserRole): AgriUser {
  const trimmed = name.trim()
  if (!trimmed || !password) {
    throw new Error('Name and password are required.')
  }
  const users = readUsers()
  if (users.some((u) => u.name.trim().toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('That name is already registered. Please log in.')
  }
  const user: AgriUser = { name: trimmed, password, role }
  users.push(user)
  writeUsers(users)
  return user
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}
