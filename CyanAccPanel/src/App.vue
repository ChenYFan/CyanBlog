<script setup>
import { ref, watch } from 'vue'
import router from './router.js'
router.afterEach((to, from) => {
  changeSlected(to.path)
})
const router_url = ref(window.location.hash.replace(/^\#/g, ''))

const showed_aside = ref(0)
const toggle_showaside = () => showed_aside.value = !showed_aside.value
const aside_nav = ref([
  {
    type: "link",
    name: "主页",
    link: "/dashboard",
    icon: 'svg/home.svg',
    activate: false
  },
  {
    type: "intro",
    name: "访问优化"
  },
  {
    type: "link",
    name: "CDN请求与缓存",
    link: "/cdnFetch",
    activate: false,
    icon: 'svg/cdn.svg'
  },
  {
    type: "link",
    name: "CDN镜像与匹配规则",
    link: "/cdnDomainConfig",
    activate: false,
    icon: 'svg/rule.svg'
  },
  {
    type: "link",
    name: "博客请求配置",
    link: "/blogFetch",
    activate: false,
    icon: 'svg/blog.svg'
  },
  {
    type: "intro",
    name: "阅读优化"
  },
  {
    type: "link",
    name: "字体与大小",
    link: "/font",
    activate: false,
    icon: 'svg/font.svg'
  },
  {
    type: "link",
    name: "暗色模式",
    link: "/darkmode",
    activate: false,
    icon: 'svg/darkmode.svg'
  },
  {
    type: "link",
    name: "评论设置",
    link: "/comment",
    icon: 'svg/comment.svg',
    activate: false
  },
  {
    type: "intro",
    name: "面板与博客"
  },
  {
    type: "link",
    name: "CyanAcc引擎设置",
    link: "/cyanacc",
    icon: 'svg/engine.svg',
    activate: false
  },
  {
    type: "link",
    name: "返回博客",
    link: "/",
    activate: false,
    no_router: true
  }
])
const ActivatePageInfo = ref({})
const changeSlected = (link) => {
  for (var item in aside_nav.value) {
    if (aside_nav.value[item].link == link) {
      aside_nav.value[item].activate = true
      ActivatePageInfo.value = aside_nav.value[item]
    } else {
      aside_nav.value[item].activate = false
    }
  }
  showed_aside.value = 0
}
changeSlected(router_url.value)
</script>

<template>
  <aside :class="{
    'translate-x-0': showed_aside,
    'shadow-soft-xl': showed_aside
  }"
    class="max-w-62.5 ease-nav-brand z-990 fixed inset-y-0 my-4 ml-4 block w-full -translate-x-full flex-wrap items-center justify-between overflow-y-auto rounded-2xl border-0 bg-white p-0 antialiased shadow-none transition-transform duration-200 xl:left-0 xl:translate-x-0 xl:bg-transparent">
    <div class="h-19.5">
      <a class="block navbar-brand m-0 text-sm whitespace-nowrap text-slate-700" href="javascript:;" target="_blank">
        <svg t="1700218862440" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="4027" width="30" height="30">
          <path
            d="M605.010859 635.586736l-28.747741 0c-11.912307 0-24.517393-9.29776-28.059056-20.658506l-14.913665-36.21583c-5.596462-10.478655-3.292999-25.938766 5.081739-34.348296l20.402679-20.36891c3.400446-3.41068 5.517667-8.118911 5.517667-13.31833 0-5.208629-2.080382-9.91379-5.517667-13.334703l-34.623565-34.568307c-3.400446-3.399423-8.092305-5.504364-13.282514-5.504364-5.193279 0-9.91379 2.115174-13.319353 5.504364l-20.399609 20.398586c-8.374738 8.404414-23.889083 10.714016-34.373879 5.082762l-36.190247-14.893198c-11.316743-3.51301-20.653389-16.143679-20.653389-28.045753l0-28.78765c0-4.806469-1.834788-9.629311-5.51562-13.302981-3.678786-3.680832-8.485255-5.520737-13.292748-5.520737l-48.897663 0c-4.825912 0-9.633405 1.839905-13.31219 5.520737-3.675716 3.673669-5.519714 8.496511-5.519714 13.302981l0 28.78765c0 11.902074-9.252735 24.532743-20.618597 28.045753l-36.214806 14.893198c-10.516518 5.631254-25.950022 3.348258-34.319643-5.082762l-20.485567-20.383236c-3.40454-3.40454-8.125051-5.490038-13.314237-5.490038-5.189186 0-9.888208 2.115174-13.293771 5.505387l-34.536584 34.536584c-3.405563 3.405563-5.495154 8.099469-5.520737 13.304004 0 5.189186 2.115174 9.899464 5.520737 13.302981l20.367887 20.407796c8.429996 8.43102 10.738575 23.879873 5.081739 34.354436l-14.908548 36.240389c-3.518127 11.366885-16.117073 20.662599-28.030403 20.662599l-28.777417-0.029676c-4.833075 0-9.638521 1.840928-13.314237 5.519714-3.679809 3.680832-5.519714 8.497535-5.519714 13.320377l0 48.886407c0 4.815679 1.839905 9.632381 5.519714 13.31833 3.675716 3.664459 8.482185 5.505387 13.314237 5.505387l28.7723 0c11.917424 0.024559 24.491811 9.31618 28.007891 20.658506l14.936177 36.21583c5.601578 10.505261 3.322675 26.000164-5.081739 34.374902l-20.424168 20.37198c-3.405563 3.405563-5.520737 8.115841-5.520737 13.328563 0 5.189186 2.114151 9.91379 5.520737 13.319353l34.624589 34.56319c3.399423 3.41068 8.094352 5.510504 13.282514 5.510504 5.194302 0 9.91379-2.099824 13.320377-5.510504l20.428262-20.383236c8.375761-8.390088 23.804149-10.69355 34.263361-5.010107l36.300764 14.894222c11.365862 3.527336 20.618597 16.133446 20.618597 28.039613l0 28.690436c0 4.806469 1.838881 9.638521 5.519714 13.314237 3.678786 3.65525 8.486278 5.494131 13.31833 5.494131l48.870034 0c4.827959 0 9.634428-1.838881 13.313214-5.494131 3.680832-3.675716 5.520737-8.506744 5.520737-13.314237l0-28.690436c0-11.907191 9.332553-24.512277 20.643156-28.039613l36.245506-14.894222c10.489912-5.683443 25.974581-3.373841 34.405601 5.010107l20.291139 20.367887c3.399423 3.419889 8.094352 5.54632 13.319353 5.54632 5.183046 0.014326 9.907651-2.080382 13.308097-5.505387l34.623565-34.593889c3.436262-3.420913 5.517667-8.125051 5.517667-13.328563 0-5.205559-2.111081-9.909697-5.517667-13.320377l-20.397562-20.366863c-8.378831-8.378831-10.6782-23.874757-5.082762-34.380018l14.909571-36.21583c3.541663-11.336186 16.20303-20.627806 28.064172-20.627806l28.742625 0c4.806469 0 9.613962-1.846044 13.287631-5.52483 3.680832-3.680832 5.52176-8.491395 5.52176-13.30912l0-48.900733c0-4.822842-1.840928-9.639544-5.52176-13.320377C614.62482 637.426641 609.818351 635.586736 605.010859 635.586736L605.010859 635.586736 605.010859 635.586736zM342.744643 786.939863c-59.737546 0-108.145046-48.375777-108.145046-108.10923 0-59.71708 48.4075-108.12458 108.145046-108.12458 59.72322 0 108.126626 48.4075 108.126626 108.12458C450.871269 738.563062 402.467863 786.939863 342.744643 786.939863L342.744643 786.939863 342.744643 786.939863zM993.792513 395.065777c-2.664689-2.671852-6.147-4.002151-9.632381-4.002151l-20.822235 0c-8.634658 0-17.768689-6.733355-20.332071-14.965853l-10.807137-26.239618c-4.052293-7.588839-2.385327-18.786878 3.680832-24.883737l14.786775-14.762215c2.461051-2.466168 3.996011-5.876847 3.996011-9.642614 0-3.771907-1.51347-7.182586-3.996011-9.660011l-25.089421-25.046443c-2.466168-2.467191-5.865591-3.990894-9.622148-3.990894-3.762697 0-7.182586 1.534959-9.649777 3.990894l-14.785751 14.781658c-6.065136 6.085602-17.305131 7.753591-24.904203 3.675716l-26.214035-10.791787c-8.197706-2.542916-14.960737-11.692297-14.960737-20.321838l0-20.852934c0-3.481288-1.330298-6.971785-3.996011-9.642614-2.664689-2.665713-6.152117-3.996011-9.633405-3.996011L776.385994 218.715327c-3.501754 0-6.982018 1.336438-9.648754 3.996011-2.664689 2.670829-3.996011 6.161327-3.996011 9.642614l0 20.852934c0 8.629541-6.703679 17.778922-14.939247 20.321838l-26.240641 10.791787c-7.620561 4.077875-18.798135 2.430352-24.869411-3.675716l-14.83794-14.771425c-2.467191-2.467191-5.887081-3.981684-9.648754-3.981684-3.762697 0-7.161097 1.534959-9.628288 3.986801l-25.021883 25.031093c-2.471284 2.468215-3.980661 5.866614-3.996011 9.634428 0 3.761674 1.529843 7.17133 3.996011 9.638521l14.757099 14.791891c6.106068 6.105045 7.782244 17.289782 3.680832 24.87862l-10.796904 26.2652c-2.548032 8.231475-11.683087 14.965853-20.311605 14.965853l-20.847817-0.020466c-3.501754 0-6.982018 1.336438-9.643638 4.002151-2.665713 2.665713-4.006244 6.151094-4.006244 9.647731l0 35.414581c0 3.492544 1.340531 6.983041 4.006244 9.648754 2.661619 2.65548 6.141884 3.985778 9.643638 3.985778L624.885512 453.762621c8.628518 0.021489 17.742083 6.753821 20.284999 14.976086l10.822486 26.233478c4.061502 7.610328 2.409886 18.84009-3.680832 24.910343l-14.798031 14.754029c-2.466168 2.467191-4.001127 5.881964-4.001127 9.658987 0 3.76372 1.534959 7.182586 4.001127 9.648754l25.084305 25.049512c2.466168 2.460028 5.865591 3.984754 9.632381 3.984754 3.75758 0 7.17747-1.523703 9.644661-3.984754l14.802124-14.774495c6.066159-6.079462 17.248849-7.751544 24.822338-3.63376l26.295899 10.797927c8.237615 2.553149 14.94027 11.680017 14.94027 20.310581l0 20.791535c0 3.480264 1.336438 6.982018 4.001127 9.642614 2.665713 2.650363 6.141884 3.986801 9.648754 3.986801l35.405371 0c3.50687 0 6.983041-1.336438 9.648754-3.986801 2.665713-2.660596 4.001127-6.161327 4.001127-9.642614l0-20.791535c0-8.630564 6.763031-17.757432 14.960737-20.310581l26.25906-10.797927c7.600095-4.117784 18.813484-2.446725 24.924669 3.63376l14.694677 14.757099c2.472308 2.477424 5.871731 4.0175 9.654894 4.0175 3.76065 0.014326 7.182586-1.51347 9.642614-3.986801l25.084305-25.061792c2.487657-2.477424 4.001127-5.885034 4.001127-9.657964 0-3.767813-1.534959-7.17747-4.001127-9.644661l-14.776542-14.759145c-6.066159-6.071276-7.738241-17.300015-3.680832-24.910343l10.80202-26.233478c2.563382-8.217149 11.738345-14.954597 20.326954-14.954597l20.827351 0c3.485381 0 6.961552-1.331321 9.627265-3.997034 2.670829-2.660596 4.001127-6.157233 4.001127-9.642614l0-35.430954C997.788523 401.220964 996.459249 397.73149 993.792513 395.065777L993.792513 395.065777 993.792513 395.065777zM794.148543 500.722142c-43.288922 0-78.356602-35.047214-78.356602-78.32181 0-43.269479 35.068703-78.337159 78.356602-78.337159 43.265386 0 78.338183 35.068703 78.338183 78.337159C872.486726 465.674928 837.414953 500.722142 794.148543 500.722142L794.148543 500.722142 794.148543 500.722142zM794.148543 500.722142"
            fill="#2c2c2c" p-id="4028"></path>
        </svg>
        <span class="ml-1 font-semibold transition-all duration-200 ease-nav-brand">CyanAcc Panel</span>
      </a>
    </div>

    <hr class="h-px mt-0 bg-transparent bg-gradient-to-r from-transparent via-black/40 to-transparent" />

    <div class="items-center block w-auto max-h-screen overflow-auto h-sidenav grow basis-full">
      <ul class="flex flex-col pl-0 mb-0">
        <li v-for="(nav, id) in aside_nav" :class="{
          'w-full mt-4': nav.type === 'intro',
          'mt-0.5 w-full': nav.type === 'link'
        }">
          <template v-if="nav.type === 'link'">
            <template v-if="!nav.no_router">
              <router-link :to="nav.link" :class="{
                'py-2.7 shadow-soft-xl text-sm ease-nav-brand my-0 mx-4 flex items-center whitespace-nowrap rounded-lg bg-white px-4 font-semibold text-slate-700 transition-colors': nav.activate,
                'py-2.7 text-sm ease-nav-brand my-0 mx-4 flex items-center whitespace-nowrap px-4 transition-colors': !(nav.activate)
              }">
                <div v-show="nav.activate"
                  class="shadow-soft-2xl mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white bg-center stroke-0 text-center xl:p-2.5"
                  :class="{
                    'bg-gradient-to-tl from-purple-700 to-pink-500': nav.activate,
                  }">
                  <img :src="nav.icon" />
                </div>
                <span class="ml-1 duration-300 opacity-100 pointer-events-none ease-soft">{{ nav.name }}</span>
              </router-link>
            </template>
            <template v-else>
              <a :href="nav.link"
                class="py-2.7 text-sm ease-nav-brand my-0 mx-4 flex items-center whitespace-nowrap px-4 transition-colors">
                <span class="ml-1 duration-300 opacity-100 pointer-events-none ease-soft">{{ nav.name }}</span>
              </a>
            </template>
          </template>
          <template v-else-if="nav.type === 'intro'">
            <h6 class="pl-6 ml-2 text-xs font-bold leading-tight uppercase opacity-60">{{ nav.name }}</h6>
          </template>
        </li>
      </ul>
    </div>

    <!-- <div class="mx-4">
                                                <p
                                                  class="invisible hidden text-gray-800 text-red-500 text-red-600 after:bg-gradient-to-tl after:from-gray-900 after:to-slate-800 after:from-blue-600 after:to-cyan-400 after:from-red-500 after:to-yellow-400 after:from-green-600 after:to-lime-400 after:from-red-600 after:to-rose-400 after:from-slate-600 after:to-slate-300 text-lime-500 text-cyan-500 text-slate-400 text-fuchsia-500">
                                                  </p>
                                                    <div
                                                      class="after:opacity-65 after:bg-gradient-to-tl after:from-slate-600 after:to-slate-300 relative flex min-w-0 flex-col items-center break-words rounded-2xl border-0 border-solid border-blue-900 bg-white bg-clip-border shadow-none after:absolute after:top-0 after:bottom-0 after:left-0 after:z-10 after:block after:h-full after:w-full after:rounded-2xl after:content-['']"
                                                      sidenav-card>
                                                          <div class="mb-7.5 absolute h-full w-full rounded-2xl bg-cover bg-center"
                                                            style="background-image: url('./assets/img/curved-images/white-curved.jpeg')"></div>
                                                                <div class="relative z-20 flex-auto w-full p-4 text-left text-white">
                                                                  <div
                                                                    class="flex items-center justify-center w-8 h-8 mb-4 text-center bg-white bg-center rounded-lg icon shadow-soft-2xl">
                                                                    <i class="top-0 z-10 text-lg leading-none text-transparent ni ni-diamond bg-gradient-to-tl from-slate-600 to-slate-300 bg-clip-text opacity-80"
                                                                            sidenav-card-icon></i>
                                                                        </div>
                                                                        <div class="transition-all duration-200 ease-nav-brand">
                                                                          <h6 class="mb-0 text-white">Need help?</h6>
                                                                          <p class="mt-0 mb-4 text-xs font-semibold leading-tight">Please check our docs</p>
                                                                          <a href="https://www.creative-tim.com/learning-lab/tailwind/html/quick-start/soft-ui-dashboard/"
                                                                            target="_blank"
                                                                            class="inline-block w-full px-8 py-2 mb-0 text-xs font-bold text-center text-black uppercase transition-all ease-in bg-white border-0 border-white rounded-lg shadow-soft-md bg-150 leading-pro hover:shadow-soft-2xl hover:scale-102">Documentation</a>
                                                                          </div>
                                                                              </div>
                                                                                </div>
                                                                                 <a class="inline-block w-full px-6 py-3 my-4 text-xs font-bold text-center text-white uppercase align-middle transition-all ease-in border-0 rounded-lg select-none shadow-soft-md bg-150 bg-x-25 leading-pro bg-gradient-to-tl from-purple-700 to-pink-500 hover:shadow-soft-2xl hover:scale-102"
                                                                                      target="_blank"
                                                                                      href="https://www.creative-tim.com/product/soft-ui-dashboard-pro-tailwind?ref=sidebarfree">Upgrade to pro</a>
                                                                                  </div> -->
  </aside>


  <main class="ease-soft-in-out xl:ml-68.5 relative h-full max-h-screen rounded-xl transition-all duration-200">
    <nav
      class="relative flex flex-wrap items-center justify-between px-0 py-2 mx-6 transition-all shadow-none duration-250 ease-soft-in rounded-2xl lg:flex-nowrap lg:justify-start"
      navbar-main navbar-scroll="true">
      <div class="flex items-center justify-between w-full px-4 py-1 mx-auto flex-wrap-inherit">
        <nav>
          <ol class="flex flex-wrap pt-1 mr-12 bg-transparent rounded-lg sm:mr-16">
            <li class="text-sm leading-normal">
              <a class="opacity-50 text-slate-700" href="javascript:;">Pages</a>
            </li>
            <li
              class="text-sm pl-2 capitalize leading-normal text-slate-700 before:float-left before:pr-2 before:text-gray-600 before:content-['/']"
              aria-current="page">{{ (ActivatePageInfo.link || '').replace(/^\//g, '') }}</li>
          </ol>
          <h6 class="mb-0 font-bold capitalize">{{ ActivatePageInfo.name }}</h6>
        </nav>

        <div class="flex items-center mt-2 grow sm:mt-0 sm:mr-6 md:mr-0 lg:flex lg:basis-auto">

          <ul class="flex flex-row justify-end pl-0 mb-0 list-none md-max:w-full">
            <li class="flex items-center pl-4 xl:hidden">
              <a href="javascript:;" class="block p-0 text-sm transition-all ease-nav-brand text-slate-500"
                @click="toggle_showaside">
                <div class="w-4.5 overflow-hidden">
                  <i :class="{
                    'translate-x-[5px]': showed_aside
                  }" class="ease-soft mb-0.75 relative block h-0.5 rounded-sm bg-slate-500 transition-all"></i>
                  <i class="ease-soft mb-0.75 relative block h-0.5 rounded-sm bg-slate-500 transition-all"></i>
                  <i :class="{
                    'translate-x-[5px]': showed_aside
                  }" class="ease-soft relative block h-0.5 rounded-sm bg-slate-500 transition-all"></i>
                </div>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="w-full px-6 py-6 mx-auto">
      <router-view></router-view>
    </div>
  </main>
</template>