'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [screen, setScreen] = useState('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [loggedUser, setLoggedUser] = useState(null)

  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [registerName, setRegisterName] = useState('')
  const [registerRe, setRegisterRe] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')

  const [site, setSite] = useState('')
  const [ta, setTa] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [cause, setCause] = useState('')
  const [workDone, setWorkDone] = useState('')
  const [genesisAccepted, setGenesisAccepted] = useState('')
  const [sitePresence, setSitePresence] = useState('')
  const [observations, setObservations] = useState('')
  const [extraType, setExtraType] = useState('50')
  const [stampText, setStampText] = useState('')

  const [entries, setEntries] = useState([])
  const [selectedStamp, setSelectedStamp] = useState('')

  useEffect(() => {
    const savedUser = localStorage.getItem('loggedUser')

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setLoggedUser(parsedUser)
      setScreen('dashboard')
    }
  }, [])

  function formatDateBR(dateValue) {
    if (!dateValue) return ''
    const [year, month, day] = dateValue.split('-')
    return `${day}/${month}/${year}`
  }

  function formatMinutes(minutes) {
    if (minutes === null || minutes === undefined) return '0h 0min'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  function calculateDurationMinutes(start, end) {
    if (!start || !end) return 0

    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)

    const startTotal = startHour * 60 + startMinute
    const endTotal = endHour * 60 + endMinute

    return endTotal - startTotal
  }

  function clearLaunchForm() {
    setSite('')
    setTa('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setCause('')
    setWorkDone('')
    setObservations('')
    setExtraType('50')
    setStampText('')
  }

  function getClosingPeriod(referenceDate = new Date()) {
    const today = new Date(referenceDate)
    const day = today.getDate()

    let start
    let end

    if (day >= 15) {
      start = new Date(today.getFullYear(), today.getMonth(), 15)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 15)
    } else {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 15)
      end = new Date(today.getFullYear(), today.getMonth(), 15)
    }

    return { start, end }
  }

  function toDateOnlyString(dateObj) {
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  function getPaymentProjectionLabel(periodEndDate) {
    const paymentDate = new Date(
      periodEndDate.getFullYear(),
      periodEndDate.getMonth() + 1,
      1
    )

    const monthName = paymentDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    })

    return monthName.charAt(0).toUpperCase() + monthName.slice(1)
  }

  function getSummaryData() {
    const { start, end } = getClosingPeriod()
    const startString = toDateOnlyString(start)
    const endString = toDateOnlyString(end)

    const periodEntries = entries.filter((entry) => {
      return entry.work_date >= startString && entry.work_date <= endString
    })

    let total50 = 0
    let total100 = 0

    for (const entry of periodEntries) {
      const minutes = Number(entry.duration_minutes || 0)

      if (String(entry.extra_type) === '50') {
        total50 += minutes
      } else if (String(entry.extra_type) === '100') {
        total100 += minutes
      }
    }

    return {
      periodStartLabel: formatDateBR(startString),
      periodEndLabel: formatDateBR(endString),
      paymentProjection: getPaymentProjectionLabel(end),
      total50,
      total100,
      totalGeneral: total50 + total100,
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setMessage('')

    if (!registerName || !registerRe || !registerUsername || !registerPassword) {
      setMessage('Preencha todos os campos do cadastro.')
      return
    }

    setLoading(true)

    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('username', registerUsername)
      .maybeSingle()

    if (existingError) {
      console.error(existingError)
      setLoading(false)
      setMessage('Erro ao verificar usuário existente.')
      return
    }

    if (existingUser) {
      setLoading(false)
      setMessage('Este usuário já existe.')
      return
    }

    const { error } = await supabase.from('users').insert([
      {
        name: registerName,
        re: registerRe,
        username: registerUsername,
        password: registerPassword,
      },
    ])

    setLoading(false)

    if (error) {
      console.error(error)
      setMessage('Erro ao cadastrar usuário.')
      return
    }

    setMessage('Usuário cadastrado com sucesso.')
    setRegisterName('')
    setRegisterRe('')
    setRegisterUsername('')
    setRegisterPassword('')

    setTimeout(() => {
      setMessage('')
      setScreen('login')
    }, 1500)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setMessage('')

    if (!loginUsername || !loginPassword) {
      setMessage('Preencha usuário e senha.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', loginUsername)
      .eq('password', loginPassword)
      .maybeSingle()

    setLoading(false)

    if (error) {
      console.error(error)
      setMessage('Erro ao fazer login.')
      return
    }

    if (!data) {
      setMessage('Usuário ou senha inválidos.')
      return
    }

    setLoggedUser(data)
    localStorage.setItem('loggedUser', JSON.stringify(data))

    setLoginUsername('')
    setLoginPassword('')
    setMessage('')
    setScreen('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('loggedUser')
    setLoggedUser(null)
    setLoginUsername('')
    setLoginPassword('')
    setMessage('')
    setStampText('')
    setEntries([])
    setSelectedStamp('')
    setScreen('login')
  }

  function handleGoLaunch() {
    setMessage('')
    setStampText('')
    clearLaunchForm()
    setScreen('launch')
  }

  function handleGoClosings() {
    setMessage('Próximo passo: criar a tela de fechamentos.')
  }

  function handleBackToDashboard() {
    setMessage('')
    setStampText('')
    setSelectedStamp('')
    setScreen('dashboard')
  }

  async function handleGenerateStamp(e) {
    e.preventDefault()
    setMessage('')

    if (
      !site ||
      !ta ||
      !date ||
      !startTime ||
      !endTime ||
      !cause ||
      !workDone ||
      !genesisAccepted ||
      !sitePresence
    ) {
      setMessage('Preencha todos os campos obrigatórios.')
      return
    }

    const durationMinutes = calculateDurationMinutes(startTime, endTime)

    if (durationMinutes <= 0) {
      setMessage('O horário final deve ser maior que o horário inicial.')
      return
    }

    const generatedStamp = `Nome: ${loggedUser.name}
    RE: ${loggedUser.re}
    Site: ${site}
    TA: ${ta}
    Data: ${formatDateBR(date)}
    Início Atividade: ${startTime}
    Fim Atividade: ${endTime}
    Aceite no Genesis: ${genesisAccepted}
    Presença no Site: ${sitePresence}
    Motivo: ${cause}
    Serviço: ${workDone}
    OBS: ${observations || '-'}`

    setStampText(generatedStamp)
    setLoading(true)

    const payload = {
      site,
      ta,
      cause,
      workDone,
      genesisAccepted,
      sitePresence,
      observations,
      stampText: generatedStamp,
    }

    const { error } = await supabase.from('entries').insert([
      {
        user_id: loggedUser.id,
        extra_type: extraType,
        work_date: date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        payload_json: payload,
      },
    ])

    setLoading(false)

    if (error) {
      console.error(error)
      setMessage('Carimbo gerado, mas houve erro ao salvar no banco.')
      return
    }

    setMessage('Carimbo gerado e salvo com sucesso.')
  }

  async function handleOpenEntries() {
    if (!loggedUser) return

    setLoading(true)
    setMessage('')
    setSelectedStamp('')

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', loggedUser.id)
      .order('work_date', { ascending: false })
      .order('id', { ascending: false })

    setLoading(false)

    if (error) {
      console.error(error)
      setMessage('Erro ao carregar lançamentos.')
      return
    }

    setEntries(data || [])
    setScreen('entries')
  }

  function handleViewStamp(entry) {
    const stamp = entry?.payload_json?.stampText || 'Carimbo não encontrado.'
    setSelectedStamp(stamp)
  }

  async function handleCopyStamp(entry) {
    const stamp = entry?.payload_json?.stampText || ''

    if (!stamp) {
      setMessage('Carimbo não encontrado para copiar.')
      return
    }

    try {
      await navigator.clipboard.writeText(stamp)
      setMessage('Carimbo copiado com sucesso.')
    } catch (error) {
      console.error(error)
      setMessage('Não foi possível copiar o carimbo.')
    }
  }

  async function handleDeleteEntry(entryId) {
    const confirmDelete = window.confirm('Deseja realmente excluir este lançamento?')

    if (!confirmDelete) return

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', loggedUser.id)

    if (error) {
      console.error(error)
      setLoading(false)
      setMessage('Erro ao excluir lançamento.')
      return
    }

    const updatedEntries = entries.filter((entry) => entry.id !== entryId)
    setEntries(updatedEntries)
    setSelectedStamp('')
    setLoading(false)
    setMessage('Lançamento excluído com sucesso.')
  }

  const summary = getSummaryData()

  return (
    <main className="min-h-screen bg-gray-100 text-black flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md text-black">
        {screen === 'login' && (
          <>
            <h1 className="mb-6 text-center text-2xl font-bold text-black">
              Sistema Horas Extras
            </h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Usuário
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite seu usuário"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Senha
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite sua senha"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMessage('')
                setScreen('register')
              }}
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-3 font-medium text-black hover:bg-gray-50"
            >
              Cadastrar Usuário
            </button>

            {message && (
              <p className="mt-4 text-center text-sm text-red-600">{message}</p>
            )}
          </>
        )}

        {screen === 'register' && (
          <>
            <h1 className="mb-6 text-center text-2xl font-bold text-black">
              Cadastro de Usuário
            </h1>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  RE
                </label>
                <input
                  type="text"
                  value={registerRe}
                  onChange={(e) => setRegisterRe(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite o RE"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Usuário
                </label>
                <input
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Crie um usuário"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Senha
                </label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Crie uma senha"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-600 p-3 font-medium text-white hover:bg-green-700"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMessage('')
                setScreen('login')
              }}
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-3 font-medium text-black hover:bg-gray-50"
            >
              Voltar para Login
            </button>

            {message && (
              <p className="mt-4 text-center text-sm text-red-600">{message}</p>
            )}
          </>
        )}

        {screen === 'dashboard' && loggedUser && (
          <>
            <h1 className="mb-6 text-center text-2xl font-bold text-black">
              Dashboard
            </h1>

            <div className="mb-4 rounded-xl border bg-gray-50 p-4">
              <p className="text-lg font-semibold">Bem-vindo</p>
              <p className="mt-1">{loggedUser.name}</p>
              <p className="mt-1 text-sm text-gray-600">RE: {loggedUser.re}</p>
              <p className="mt-1 text-sm text-gray-600">
                Usuário: {loggedUser.username}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoLaunch}
                className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
              >
                Lançar Hora Extra
              </button>

              <button
                onClick={handleOpenEntries}
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 p-3 font-medium text-white hover:bg-emerald-700"
              >
                {loading ? 'Carregando...' : 'Meus Lançamentos'}
              </button>

              <button
                onClick={handleGoClosings}
                className="w-full rounded-lg bg-purple-600 p-3 font-medium text-white hover:bg-purple-700"
              >
                Ver Fechamentos
              </button>

              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-red-600 p-3 font-medium text-white hover:bg-red-700"
              >
                Sair
              </button>
            </div>

            {message && (
              <p className="mt-4 text-center text-sm text-blue-700">{message}</p>
            )}
          </>
        )}

        {screen === 'launch' && loggedUser && (
          <>
            <h1 className="mb-6 text-center text-2xl font-bold text-black">
              Novo Lançamento de Hora Extra
            </h1>

            <form onSubmit={handleGenerateStamp} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Nome
                </label>
                <input
                  type="text"
                  value={loggedUser.name}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 p-3 text-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  RE
                </label>
                <input
                  type="text"
                  value={loggedUser.re}
                  disabled
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 p-3 text-black"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Site
                </label>
                <input
                  type="text"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite o site"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  TA
                </label>
                <input
                  type="text"
                  value={ta}
                  onChange={(e) => setTa(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite o TA"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Data
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Início Atividade
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Fim Atividade
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Aceite no Genesis</label>
                <select
                  value={genesisAccepted}
                  onChange={(e) => setGenesisAccepted(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecione</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">Presença no Site</label>
                <select
                  value={sitePresence}
                  onChange={(e) => setSitePresence(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Selecione</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Motivo
                </label>
                <input
                  type="text"
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite o motivo"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Serviço Executado
                </label>
                <input
                  type="text"
                  value={workDone}
                  onChange={(e) => setWorkDone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite o serviço executado"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Observações
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black placeholder-gray-400 outline-none"
                  placeholder="Digite observações"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Tipo Hora Extra
                </label>
                <select
                  value={extraType}
                  onChange={(e) => setExtraType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-black outline-none"
                >
                  <option value="50">50%</option>
                  <option value="100">100%</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
              >
                {loading ? 'Gerando e salvando...' : 'Gerar Carimbo'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleBackToDashboard}
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white p-3 font-medium text-black hover:bg-gray-50"
            >
              Voltar ao Dashboard
            </button>

            {message && (
              <p className="mt-4 text-center text-sm text-blue-700">{message}</p>
            )}

            {stampText && (
              <div className="mt-4 rounded-xl border bg-gray-50 p-4 whitespace-pre-line text-sm text-black">
                {stampText}
              </div>
            )}
          </>
        )}

        {screen === 'entries' && loggedUser && (
          <>
            <h1 className="mb-6 text-center text-2xl font-bold text-black">
              Meus Lançamentos
            </h1>

            <div className="mb-4 rounded-xl border bg-blue-50 p-4">
              <h2 className="text-lg font-bold text-black">Resumo do Fechamento</h2>

              <p className="mt-2 text-sm">
                <span className="font-semibold">Período:</span>{' '}
                {summary.periodStartLabel} até {summary.periodEndLabel}
              </p>

              <p className="mt-1 text-sm">
                <span className="font-semibold">Projeção de recebimento:</span>{' '}
                {summary.paymentProjection}
              </p>

              <p className="mt-1 text-sm">
                <span className="font-semibold">Horas 50%:</span>{' '}
                {formatMinutes(summary.total50)}
              </p>

              <p className="mt-1 text-sm">
                <span className="font-semibold">Horas 100%:</span>{' '}
                {formatMinutes(summary.total100)}
              </p>

              <p className="mt-1 text-sm">
                <span className="font-semibold">Total geral:</span>{' '}
                {formatMinutes(summary.totalGeneral)}
              </p>
            </div>

            {entries.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-4 text-center text-sm text-gray-600">
                Nenhum lançamento encontrado.
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-xl border bg-gray-50 p-4">
                    <p className="text-sm">
                      <span className="font-semibold">Data:</span>{' '}
                      {formatDateBR(entry.work_date)}
                    </p>

                    <p className="mt-1 text-sm">
                      <span className="font-semibold">Tipo:</span>{' '}
                      {entry.extra_type}%
                    </p>

                    <p className="mt-1 text-sm">
                      <span className="font-semibold">Horário:</span>{' '}
                      {entry.start_time?.slice(0, 5)} às {entry.end_time?.slice(0, 5)}
                    </p>

                    <p className="mt-1 text-sm">
                      <span className="font-semibold">Duração:</span>{' '}
                      {formatMinutes(entry.duration_minutes)}
                    </p>

                    <p className="mt-1 text-sm">
                      <span className="font-semibold">Site:</span>{' '}
                      {entry?.payload_json?.site || '-'}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleViewStamp(entry)}
                        className="rounded-lg bg-blue-600 p-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Ver
                      </button>

                      <button
                        onClick={() => handleCopyStamp(entry)}
                        className="rounded-lg bg-emerald-600 p-2 text-sm font-medium text-white hover:bg-emerald-700"
                      >
                        Copiar
                      </button>

                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={loading}
                        className="rounded-lg bg-red-600 p-2 text-sm font-medium text-white hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleBackToDashboard}
              className="mt-4 w-full rounded-lg border border-gray-300 bg-white p-3 font-medium text-black hover:bg-gray-50"
            >
              Voltar ao Dashboard
            </button>

            {message && (
              <p className="mt-4 text-center text-sm text-blue-700">{message}</p>
            )}

            {selectedStamp && (
              <div className="mt-4 rounded-xl border bg-gray-50 p-4 whitespace-pre-line text-sm text-black">
                {selectedStamp}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}