import { listAllCategories } from '@api/sw/cate'
import { sendMsg2Runtime } from '@api/sw/common'
import { getOption, setOption } from "@api/sw/option"
import { useLocalStorage, useProvide, useProvider, useRequest } from "@hooks"
import { isDarkMode, processDarkMode } from "@pages/util/dark-mode"
import { toMap } from "@util/array"
import { CATE_NOT_SET_ID } from "@util/site"
import { computed, ref, shallowRef, watch, type Component, type Ref, type ShallowRef } from "vue"
import { useRoute, useRouter } from 'vue-router'
import { isMenu } from './components/Footer/Menu'
import { t } from "./locale"

type ViewSlots = {
    toolbar: Component
    headerOption: Component
}

type PopupContextValue = {
    reload: () => void
    darkMode: ShallowRef<boolean>
    setDarkMode: ArgCallback<boolean>
    cateNameMap: ShallowRef<Record<number, string>>
    menu: Ref<tt4b.ui.PopupMenu | undefined>
    viewSlots: ShallowRef<ViewSlots | undefined>
    setViewSlots: ArgCallback<ViewSlots>
}

const initMenu = () => {
    const [stored, setStored] = useLocalStorage<tt4b.ui.PopupMenu>('popup_menu', isMenu, 'percentage')
    const route = useRoute()
    const router = useRouter()

    const fromHash = window.location.hash.replace(/^#\/?/, '')
    if (isMenu(fromHash)) {
        router.push(`/${fromHash}`)
    } else if (stored) {
        router.push(`/${stored}`)
    }

    const menu = computed({
        get: () => {
            const menuMaybe = route.path.substring(1)
            return isMenu(menuMaybe) ? menuMaybe : undefined
        },
        set: val => val && router.push(`/${val}`),
    })
    watch(menu, val => {
        if (!val) return
        setStored(val)
        sendMsg2Runtime('meta.popup', val)
    }, { immediate: true })
    return menu
}

const NAMESPACE = '_'

export const initPopupContext = (): ShallowRef<number> => {
    const appKey = ref(Date.now())
    const reload = () => appKey.value = Date.now()

    const { data: darkMode, refresh: refreshDarkMode } = useRequest(async () => {
        const option = await getOption()
        return processDarkMode(option)
    }, { defaultValue: isDarkMode() })

    const setDarkMode = async (val: boolean) => {
        await setOption({ darkMode: val ? 'on' : 'off' })
        refreshDarkMode()
    }

    const { data: cateNameMap } = useRequest(async () => {
        const categories = await listAllCategories()
        const result = toMap(categories, c => c.id, c => c.name)
        result[CATE_NOT_SET_ID] = t(msg => msg.shared.cate.notSet)
        return result
    }, { defaultValue: {} })

    const menu = initMenu()

    const viewSlots = shallowRef<ViewSlots>()
    const setViewSlots = (slots: ViewSlots) => viewSlots.value = slots

    useProvide<PopupContextValue>(NAMESPACE, {
        reload, darkMode, setDarkMode,
        cateNameMap, menu,
        viewSlots, setViewSlots,
    })

    return appKey
}

export const usePopupContext = () => useProvider<PopupContextValue, 'reload' | 'darkMode' | 'setDarkMode' | 'cateNameMap'>(
    NAMESPACE, 'reload', 'darkMode', 'setDarkMode', 'cateNameMap'
)

export const useCateNameMap = () => useProvider<PopupContextValue, 'cateNameMap'>(NAMESPACE, 'cateNameMap')?.cateNameMap

export const useMenu = () => useProvider<PopupContextValue, 'menu'>(NAMESPACE, 'menu').menu

export const useViewSlots = () => useProvider<PopupContextValue, 'viewSlots' | 'setViewSlots'>(NAMESPACE, 'viewSlots', 'setViewSlots')