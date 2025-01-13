
import { db } from '@/core/firebase'
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore'


interface DeploymentState {
  lastDeployment: Timestamp | null
  status: 'stable' | 'deploying' | 'error'
  energyLevel: number
  coherenceLevel: number
  protection: {
    flowGuard: boolean
    patternShield: boolean
    energyBarrier: boolean
  }
}

interface DeployContextType {
  deploymentState: DeploymentState
  updateProtection: (protection: Partial<DeploymentState['protection']>) => Promise<void>
  canDeploy: boolean
  isProtected: boolean
}

const initialState: DeploymentState = {
  lastDeployment: null,
  status: 'stable',
  energyLevel: 1,
  coherenceLevel: 1,
  protection: {
    flowGuard: true,
    patternShield: true,
    energyBarrier: true
  }
}

const DeployContext = createContext<DeployContextType | undefined>()

export const DeployGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deploymentState, setDeploymentState] = useState<DeploymentState>(initialState)


  const isProtected = React.useMemo(() => {
    return deploymentState.protection.flowGuard && 
           deploymentState.protection.patternShield &&
           deploymentState.protection.energyBarrier &&
           deploymentState.energyLevel >= 0.8 &&
           deploymentState.coherenceLevel >= 0.8
  }, [deploymentState])

  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(doc(db, 'deployments', 'status'), (doc) => {
      if (doc.exists()) {
        setDeploymentState(doc.data() as DeploymentState)
      }
    })

    return () => unsubscribe()
  }, [user])

  const updateProtection = async (protection: Partial<DeploymentState['protection']>) => {
    if (!user) return

    const newState = {
      ...deploymentState,
      protection: {
        ...deploymentState.protection,
        ...protection
      }
    }

    await setDoc(doc(db, 'deployments', 'status'), newState)
  }

  const canDeploy = isProtected && deploymentState.status === 'stable'

  return (
    <DeployContext.Provider value={{ 
      deploymentState,
      updateProtection,
      canDeploy,
      isProtected
    }}>
      {children}
    </DeployContext.Provider>
  )
}

export const useDeployment = () => {
  const 
  if (!context) {
    throw new Error('useDeployment must be used within DeployGuard')
  }
  return context
} 