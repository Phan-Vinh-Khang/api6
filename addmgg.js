const https = require('https');
const zlib = require('zlib');

// ✅ Danh sách cookie
const COOKIES = [
  'SPC_ST=Vms4WkZxaUNETW45MVpDdRUttbvOOC+Wk3ofN/wOSjjazKrdU1EoAUKmBh67YkklzAMjSPwHPoXXiREf5N+YBv6ShbJ0BuplKluGN/GVyU/Tf6m7RoOS9pSgblhg9iZCHTEoB0R7Dg4N60GQiwW6Hw2jVYhUf0JobKuXm/RZX/0HmZtVzwBMKvKOkErEwBOXBisW+xJ8qlRX9EVBL+dIPQ==.AE2U3kUtxUaklTRXkbq/Nr188s5wmAXHmAM15UCENXtX',
  'SPC_ST=NVQ5NXdZSkhpYjN2T2t6V0qwpebvY+Ha64rAFe/dYbhw9K9o85s5jhUjoY8HFfK8hgEs5CM5B5d9AHqKNsTifr0Vqd8NT/Z8GGFbNTdq1L2Aiwi8AI3CeOxYS3paLjcuo1zcQUTGO+G1eEUc2F/c/ZQaaZogfa5PIGJjglT689ioeT8qr+cIEOT1i0ovd9Jl.ACGuZHzeRlxCaCGmVlVobQGStjtTVZxViVTj6N5oIkBT',
  'SPC_ST=VElEd0p2VG9yNHZjVWJPeA7swcmcefGrVR3D0tzX4b5lbMjDlR9DeMx5hkpUdPI9s9Jx2jWcZUkkWRMtzNxX+tjTJ7BHOqjaZUZqrQdBc1AOTQrnQH+srrPrnmwBaDEzWQFfHJMRPKEebTg/+8W4djlcHqpetufwO/3Qf2r5FZxA2+gKxnK7LMXK0jdk9bek.AK2mnlg65nkW5CoVTbi024cG9nd+UQpGwo8F+UhUVlSB',
  'SPC_ST=RUJ6VllpNzhLOFNZZ3BYdh/HctoZygLBOnV0qwz30I2ZTtqNE67QjfQ46ZosiXjhi9NZYCOvC747PKBqVlAm6+qM0HtQpyQPkepvosEvWVcPhkTKYKecsIDljBNBy6pxPAknwmYT2RKnLuwnn7gDLCAWfKjcoU09javdcmG85kaL4d5UVfsS/0gAAsLAgmDq.AKUp6sbC5nHRt2lrcwiK5FL0dIjNUVE+9jacAnruU48I',
  'SPC_ST=eGFkc1FrbjBNOXZsSFlvQXp2X0J8MetkKyy+9EUhMZ2mN1Etr1EPc4qcjMj+jDsZWKj43Vap7NFA55FyI2tlj+DrHg6InSme96pkV0mDwdv9oJp5NxFhFYhJgMyS/ATSvFmAo+6fT5zUxVL5Gg0A5/ncg15tijxwwfpnNVt4CbsLpUkwEEGl5Fq3ksoH921VOj/5Zmz3UlNRMQl9RMZT9A==.AM8/uNWkKnhJVEikkmIItEVrEzUSwvIbj9R0JFGIEaj+',
  'SPC_ST=dFBRakIwOU83cURzVlFqV2wxFYNj2XuMiAHlmvJggVx1EbEje1WYKbjPjgTDIFZdJoBjn8cOfA7Eo8ZhbKM/R7Fu8GIv40GoPPzGl9uuKQ0HhB8P5+tn/YFHxjw9rSyz8mDUxB7oyav9X4PpLur2NrmP+T5Ymgw/yyilKD0qzA1wcG1k07tyZx0QIoU9n/p4.AKSHx8hjIEFRZjfyIvXw8Va4o61EygWWlGx8eEukKBcG',
  'SPC_ST=cHhvSHMxanJPN2szT0ZuRH6KGdffY0Kjs0SZdys9bMeMBotQXXWn643KCF8+EQJYATAufxjasKCGcsna3U3PK5RM8/yWYjUqENDYfWP8Kgl0dTqPlho0Vk280IXEud6JpsWNBWdf9ABWnL8acUCtqKfhBwpa7F9dvKVHCKDDmXofJwCfALz92+eQ2mxmAwTX.ANO2Ie7Zrm9thHZM1KDgm9h8W8CX5ZTei6ndvedNZHzE',
  'SPC_ST=a29Kdzl2Y21ScGpHNHl4RA0FlD8ss2jNIG2Fmc1HlNP+aK8MLgSCp5t3nnpdoo7yX2H/hnyAaETvLF+D144LCCYW1BMdWgFKwKOEkdUF7yCcEu0p7b6WCRBtk+m9plK1lRjoG8XZpjQ8JoWceN+FFVdKfQQVk3FsU5o8kuuBBE12IeQ4PwC82eCv0BX/p0Hg.ADi5EAUPMq0K/9IFI4SH8LVKi9AXHOkCRRH9oMegZRk7',
  'SPC_ST=NVNZbnFkaWM3VElhMzdseO6jJjYopHukdj+ATd+0x/3wow2eCmNG80kGGL1va/rDcPel+G2FNRvFAsJ9ILTeG+T+IAQLZK9henvmavTdrRRwgZalNTyQKraRJtLOWob8N0QrafnQmUJ/3kb6h3A1RGkJeRXo9LmwiS+NjyreJ4rJu3KunRRXRlWepwKaVDmxdT1j71i+yKGmz+1BuWJ7Qw==.AH2v6YAj3SuFI6OdCY063wXXerD8aT7C1AWGs1I8XrQV',
  'SPC_ST=dGpmQVdiQVdtZTE5ZEM2MYdbsgQR5QvcLSA5Md/WctnZc4ptYjs/MRTZim3ED8vzEKqelj4eOlFJUiHe1WDH0UPtrGfgVywKifSA0t010OhK1zvESGUVpUJYitJvKCpdyT+bfSHBHHDqKsMxn4TUl/MxFwb2zB2+RkHBNbDH0pjTLxSL4tSyI9PNd6oeMx8+.AJSPOlQzSkeNm7DB8A6aV+2GOkbYouZrvPPhisTujifD',
  'SPC_ST=QzNPUks1SGZGSU9IT1hYZLzfES8nK39FRNgFUCDwZpr6vtANJLW12c6CmUhaC1nXj+oA2JbZpxa3fuQWqTMEejNVg2QkM323FyQvCoGmf9xJBXG/WjZwArtINyYMW2lmQALNYdVghus0c21Tw8wPzr+a3qBw7pBEFamUvvi/+gk/A34yXrEIZSLsUHE9iJ4g.AC06pdRGhgh282O/JTP8Yj67Re0pE67Odf77RkJUWRLy',
  'SPC_ST=b2hMUWVlRnJyVDNseFY3ZfeJ+Y8jFLgJ7NSiAfYW5WddJQ/lPgFd+d7823ztXgtEWCIEoJBUQlsNGCTgR3dPYznHt8xoq37g48IBled0G+eoGk9hOsBq0PVBrd8CCDur8nXVh4OCzsLF9qlXM6ULwEibIhfzlFEHyqhMDUxhmmCfKKBm9/S3E+aypfq+SbFn.AF1sCXbJe9DeEniu4lErqeRYb5fVl7rHQ9ZkYOuA8tR0',
  'SPC_ST=SUhUYTBQZ3lWQWQ3QWxkYwlzTBu8BT3fIl9NCJfIGKOGqWH30qKQrKAqnVENx0xMTwvvB6S9XesrNyDNWW2ES7JZeI0Hmt+nVdYne/xOFqUF62lJtfNWJh0jHqlb7BGC9QDrWdpwXPNxQZj1U3pC4qxixOuECC3lrEBTk2/D9T7m3S87Ixu7Dyxc8SIv5q+m.ANdbfUn/qPj0MojnauVun0a3JUleQFNEUX5aaZF8PprI',
  'SPC_ST=VWpvcFFtalRCRE1IZUN6NcoZ8Cn+JMZF3K/oRTXwkgUggWZSOE2zjBWghIY7iDIyQXkGzKrBZ3rGidvMv9ZTMEPYY7FVcrAfe8tdJPvYWAqZGtj3xdAn2iDtPkD1aprVrfpIsnMEzhrvZCtD+Ugp3XCWGSQtSInUx8LXt7hzu2mZid8GXJW/d6Gpu1bOOxpl.ALe99MFek1hwGfvUEsCROmRFM5tvxNP+956RoB0I79O8',
  'SPC_ST=STRRZG5UYVQ5bGx6WTVzbOmn/RSkf2g+X5LhQ9y7YF+vUk6Hgopc8th6o8CRPmpl13Y8Z1ujZXDGCM/wbrh+aMenWv6/pFRoW2NfsZA+2cG1sYCoBQK+EFDcGyVa7eHS8umzRqJrzgqdne0EX4UWKC44EYEpvCX4BglXQUtq7eG/njlkVBGisO9csrUXmVVP.ACWMA+ltRGz3kEivlMXt1wp344wy4dQibXvxhn+QOWbf',
  'SPC_ST=ZU1oYkVWVWtTTjE5NmpCNNd/dZLV4uMVjV4EmA8xOSuTPpcsGyBFm+Ku9FVxmmHz5ETwGilST+WQFYNkBx42OnkdmWqWKf516LCdphr+MrQb6BA4y2y6+0dczn6zylH1hIhSogZOVm/FwA2ocGDNQLkfFaj9+GUdZ1JSoQ1z81TAIl0uNymr3uF4wjQ0nZJA.AJvLnRHOMgbuPU8r3wVvRn+GW+qiqxHcd8/ziPRT3nfb',
  'SPC_ST=aFVGckVwRXN6MlZkckVhMs+S8+GiNorB9Re5W5lxZWrigQ5n3wAAE3Y28Cnu/QpcuyaLHDQlJbbhPpY/OR12ITG7T8tIOVxf56TArWEiogRzrfsHYOUfS7ry6B3w+L+BYzQNRjqFcmWWndeU5+V9ktYMCSRKztO9Vq/er9dD1XxJv2/FjHX/Be4WETtFkzIzbyg1+axas6nxG4KMwgFkQg==.AD54Q1uexkt3Ss2vLwnaouAMCoJqLqy1trHn8hQp5KT1',
  'SPC_ST=S1VWdVdGa21lSFpybnAydLP+5Bgcflm9Kszrd+tjFh0log0YXMJY5YOJbHZJLRTD+Mj0qw7nbSZQJrBEinhbS704q64sNvPhLagQ8EGaYjiDvcWNBeuEDq/STYeluXNR8Qx/seGx2xUo35yQ+7wz5XRh3T16b9gjasYYxn5PcwBuOgeUToD/lwNE0NDv4hhHMBDhs1NpDnTTiWIFhiUjbg==.ABGDCC+SdGVSH6JNJ/QyKjlQSeRW6Qn+fEkIszIneJ7+',
  'SPC_ST=Q05ud2hFMDJDTUxFcWZoVQ8Ux2m2o6cEiPaRVBP1OUn9Xc3G6w9WBTmnbAzrXRZgsD/fpPYkE76g1ubf7D1SIBrwkwu8RzR2z8yWHIZZUGsiqX6QyHBHXBO/yxE2nXHt8gUWmnIHoGsHWVsBRlvi4QBUw5N46r8/rapyssMljK64fKz6Xl2L6n4W+cpa/GEn.ADZTJv6mijcAKJlAt3IqWvbiWDLw4UCdy/GQgxESldIw',
  'SPC_ST=M29UOWM2SW1jZW5hdG1wdTOQmF1zXGuwE2/emjtmKA75z5UzWOnExDTeo29vtZLGHkL1d3x49D8S62xh34Xp7YsEPTef6Ser42YzCErHHIWRhRTZduiRsX5co73B63153fFfl8xfmmq+IW0hpENZ3cef+uRU4v7I77EKiAPW1O7heLMPFBtmJdrZ6+U7cczI.AGk/6YhM1CRAe8dhNFkErKhrndKmy9FQ3NhIsy1WFWdm',
  'SPC_ST=OHN4N2xhMVU4THpONVowUlUton/SbioS+dFYHaa/OBjITyBSC5WCgZ73DK980Q1TKTR1ep+1WOkdV2Vd1mX9u2vkPXSumSR/RsonYz4gKunF97YgSFmeb84g/dlf3TbKz2R31YYNi7q9wkvhivDNhz1z5wcmlGghxZc7Z2fxVWEgxG/WUrQiIPiPAXOU3Hh6S83yjT6dJZz9BArMUFGYQQ==.AMy6gHA3dFvm7d6mtaTHMdLYw31q+/KoRnyTsPjTc3d1',
  'SPC_ST=TkZMTGNKcDRIMm5SYWhISGUUwSwOkO0TVkYuucR7Xm4oKTAXm85E0mIKSD+OSj6Jw1NuZ/VAR9S5rE+L9Hc1fRhF/sNq2C/Ojfdxx34h6Anibr7rtX6O84NF8Ufsm8gUQIXbYuD3GXsJuw+qv7UdC37HUBtEMevnk/xzFajBLoeKud1VTaGkLKmWtUCB14dW.ABrTNQw7179tREKFkyHQI4Z+C/cQaZRXhTiVZG+pTIr7',
  'SPC_ST=VGxoS1E1RDVzamRjUlJxeesLBi6fHUCemDEAmB1gKO6pR8uigZOQ4wGqft26Dze3qLhpcVyr9a61Sna0jvybSSQhfgWc7fLe/SQFQLNH6lIbo0YQFbs6w5aM6z+qaHIkc8Lz58XJdrWmhoFMNSNEOS7TCD/veHZK2cqC4B4tO9gr3D+S/PF7PbuGq9Gi2V2+.ADEEoZp8mvFoRognK7hSAXiJpHzcUlVZVtuyiq5Wyvye',
  'SPC_ST=WEUzUlFVYndSbXlTRk8yVfaaOZ7qXniFxk+yU7nAukkiMyjfLfc2KcJdn91/iEvfqcusQPp4PJnsYwKW+h9iN1ziE35KURTydyy+iN2QJ6PQQgAUCziyva1+yiYnJkBHxZGaDjeCk3hdEzuZcWNABFOnjinuexJNFsQSYQWkycDOcQnAE9TebYwsKPnBG5kssWOVyzWDt5Myqp33ejRE+Q==.ADYZo4quSVPlxpOH4pPGOQpFwmeIHonVXn60jNhGhm41',
  'SPC_ST=OWhjV0FqRjdBclRHdEJWSZAjPAQiy5F/MTiK9Le8YKc4pOV9uVWE1yYRlau9T77J4AxuEYlYax8+D+QxhyUh8fO6DAhY+pc1F/ZxZk5OYOB3fiB1UAtc2RuPG+CpDu7xzJ7+pZNdNvA+/O5myCrhhmpoquc1x4TbBsiiXVFKAm0KfBQp1/7DF5fgSPAFEZM5.ALKr0Yvl48NcUAzjB15rC6/mdY4FKWufxScYxWNjr/RE',
  'SPC_ST=WDFNWjlqY2xkWlE5aFNyaOryvo49yIsJe8JdQDI11XZd7p9ewt4Kf5MqRsbzMrM5uPUSfr1ItXfYahKzJWFHoUSt7JrOfswbwaOBoZTg2z5giP2YoK+e2khUI61RMJQjnyLUVEeafqD1u1HSdHZeACjBS7ymNxGALd9iP6PzRTjT8FfV8Mjhtefnxt6/faOH.ADxc5ei2GdyqsXDJ9gxKJng3KSbpu5ri33J/Rb+kGSyb',
  'SPC_ST=WU82VVRiQ3JhalA3eTNCaIu8vw0C3W8QSak03mpvoIgyZrfUjt4J+aHs+k6iq/M5tISxsZsYjSZuGG0gd0Rxpv7qjfY2pCsg5ZimZVkJmqn4awIyQx14ypsebJb//SnIuAE+wSC8Y646ugjJwOve0SoSKI5lJENtJKU7HuD6lMpE108gpR+9UilEhRvb5sPDmHBGQMClHQxYYzMGq4hf8g==.AGrfmGKI93+v7pQTpp8ccn2hR+accubKNAm2Ge9AwQvW',
  'SPC_ST=b3pnZE1GMnMxYjFOdlZ3S+l4+Q+UaFIJb0Newzh0W1VNZRc2k9GfZWpa8Lc+Z9Bv/2HrWMYfbYr+ZPZVHTLnNWHF9120LPoYGRg/VG7MsFsOflk4kM/7A2Iu1T0852i7wINpRzuXtDNUUpj3n9S91LotNx0HYHFWSt0Su6OUo4x6vgjLRRtjSlVWoWmXypTOnuxSF+wgOQ+PddGNSW1aVg==.AMiao0CGdiVpe2msNuQ76g26oTJNvHFSQYgRSsvTKUMv',
  'SPC_ST=c2lMcU9TTEs2OVV5WGk3ZSPjYG6TYSHphArn6kL7xoXc/CKtgzp9Jg9pwhYjLxmoTTa5LgCRwlD2fTZCi/l9/6HHSyQlMBkUfenP5sy+Sklho2Kboi/ryOiQO2ob5IBCHSWg6XOyPdQwCOGxAL+TV+CWT37/o+bxA4qBai+M8GUkqJE49xc0MGcyu6bZ2dFK.ABl256XNc/yqGnnky1/a3Le5ZpSakvi12Vl4hxkM6lJV',
  'SPC_ST=b1lJYUYzTHZ5anNBNHBIbTz+eX0FFkd9/WSNejm+r2h55e3KaBybTZRPxpydtbTCYW2h8lSZOB/qObGwzEn77/nmELV8NJ9XE1ig7hq5XxnbAwUKwbH34hJs6eTSg/67reI/xqw1f11hrcXcykcwgytelYRsFCOfxTCEqNug8/CN+7qSD3WILiMCqP/cTsAOYCmpXe7EZxl4lpx9Uq8Xpg==.AFHuj3uRdaRPA65P9Qe3q9T0bZVcSmjlCLd35l2ExQVq',
  'SPC_ST=dzhhVlV2bTdZTTZ4Q2ZaRcQukvYDtBK1kNR5z16UXbptWcFKDynsqMm1/4v2TKoYHPz3P2arfg8qHaVGOKGuin6hZQxGdqWk0k8ZWRbGroMe1UJredO9iGWOk4VEUyOn2Bdkb5pvRnZ0NMk84Ygv+5vO7u7aWsj3Kb2z7eG/PAXM+W+nku5c9i/tinle/Pg/wwDHvjT7z6YnIWVveMH9oQ==.AISsFxjpPwM/ECPU/gtOJN8gbmvakaduNxE6Ys3cCdSq',
  'SPC_ST=Q1ZudDRFOGZEbllJQzRjON06sPFGxhdFuvs2eCD9NHnDto6Klc/5iSzTduhGorr5XSZ5Fd1cg8OEeDV2csmwUXX/y+ZanSFAqJr0ro58MygbY+eXp7DaI/bP+wGmDn5UlfgcbvmiehXEUAF7pLUyBz7WQ4N5viAMx5086kIqujUKqi/EwbRTDCLp7vTvhedcGbJpCdqmbEiiiwv3lxK4rQ==.AH92GtsV5C0s4vmF1RBNZ69XMkJR3lvqppPQ9/a8itPk',
  'SPC_ST=Z0JPMWdMVDRNNW5EaFpFZNMfu9/6lB9CizUMamJicjWggPJnC4x8eKkwMic17orweC8zIjqGhBcdqWOH8oN1tq9a9zUvLWZRuAMaUNkoDAdFX46l2sxhQRmAJmlziA+DIAmn8U/U5nHbAiLfi8lEP+/wPer8cVcGYOM1C507xlcvxBE2+j3v6mXNoFh4ZfoQXPljbJwqDld1D0lX/e+XKA==.AFD5RXvLKRh6ULBwMEAykKkVmsJSRY3mNxYQMeSWe273',
  'SPC_ST=YldJTzBlRzI2clFjM1dlVKRXmJ+d/Giz0F0RrbRUbPcJGtKK/egMuK+LIk6TT1j7OFkIIFN5iVNuXII04cT4sEOiVMUv/zLKtIFzdkH7ys6xXwDZtdrlUS0GueIGVw6OUyBkPVArIEmenOV6yXgjZKlDVJlBMc93D0pLJGw+hyN8RM94rsY2tvRJ3ZzX6oP5.AD8NLP/y31iJgUVWiKJt68OM2va8PH8xWKmlIInb4EV6',
  'SPC_ST=ZWx5SVVmRjROU0VCZGxtbN0iK0vVzaUbhhEW9n5HUFnOD5pDHtMirVLAJ6sovuQF5Elr14CSm3iJfkOtM7jKa7fbZGOjLF9PbB0kyA3nSEuGzs3aO+nz4BSGEkK/y/O46sWn6c+4JYUbtsbM3kDq74P3uplxLgrDyLqEOTvqd8Hf3rJXRa9715CkWTIDsywf.AFPiGB7FpBnKx2wsD4lp2y+WP2vRrZFb8PzH0nqPg1r+',
  'SPC_ST=WE1Bb0hhR3FaTjB6NHRYY9nY1GkqaJsTcR/NPxHWf/XYJaqYeCrnXew6iCnuWqH745Dqb/kTEUTUOwdQ+jj1xXRiLJKgoQYssYe599HD4TppuPQA6HPx6YWu8UpnEK2W21EacWU+tisCK0snpS9OnvcLIsWu/QcFVzi124FcCVC5ShB6d8wfnYv56LX2dpiiypioXDh0FfYUjFugS79iTw==.AJgSmdtMvdBgVU+X9xoXwylRRd9o7DsLZsViSLQo83BG',
  'SPC_ST=Mmttbm9MOERXTlNBeFhCYfcm0CiRGmdQ8RSm1wlm6rM+8MYU1R/zzkkf0+JIObkGf4ZvzT1PCZzl/NLA1FFaFT+iLO0XkTTDpycUXnJhu8Ykg1OvSz1culEWKrSnKm8VyWIQHJvHWc+Svg/yUpGrLZgZImLhhrbRDAoDtHBPtLkl28fWEBqI5A4Uz72lndQgsNTHu9YrFXYzJX7yyXm2Nw==.AJm3OLn7VXiBtu2xBO3DNLeAQF4VWzwt4Dso2mX9iW1s',
  'SPC_ST=V0lqVE9MOGV0UElWR1FParL/inC83j9X+doTcip2Ktqa1ebbZkRSgLwDlG6moVSAN999PqRDOfZDS9Hdvzp/aaA20MDQdqhmliivtf1ptWkiq42Z4iNbv+8Ui1Y55m/2Ldc9UgSKjSRhI7t3UMvj0wedTnua4ybaPWOxm4TafmQMvUbkTycwgsVr82XsFSe1rcn0MBEueOvYHd1120jIwQ==.AHAIdWOVP1Kea4xhF74ppbWAF54VfqMt2A/zZSICPV/Z',
  'SPC_ST=c2hqZGluWTFxMlBOdHNqS1q/N1lb0+zMy9RgSnisK/oUPM0ebfijqOfHVnJA7dYF8/jnnDNBPF+ryVtdTfso86dqyRu6WxOtpnxMP7Xp21G70sM3xoYw/aqLEtwrwpUMlOgMPeZe+fLTtsiyO/1h3lv1MNgc1WjzFBJMJyDRmfC5AWp94zO4oHt8erOb4VmiExYFcZI9hc+c6/nKwM6m6w==.AL8Hu53AGCsz+OLSIuj2Pzj23dwm+u+mZHIRa7W4le67',
  'SPC_ST=Z2VQR0FFemhoT0lMY213Qi8yFvbyGyL0FD2ChzqihedaQ/KBzb1jwEtkSI4VvJYwxfNG2oBEO1+mob7NObYyvJ/rCiKfRAMY2qhhMW4CuRa+t3zkh2Getrbov53YRxRJlG7OUIw2WR3KQzV/0G88VOMPMegeonn14F2CfLiPZMmXexbXniU6lHm3Hf5w0eb1639zR950Ws7THMgpBiiNSw==.AKm7LXZlUOHq+u5Sx0EslZazzTH1ixyUkwT6Co7MKRcQ',
  'SPC_ST=bkhvaDlEaGdTSEo5RW5TWsut5jyDTsTLI/A5el2pLc/7bE8nrD6898d1kqK9vVwp+lBFmFBkDGBy4aFvHk1fEuYhwwhzzMn27JS2ErGQGRZjAetUVEpbPB+LnRgbJbH6C5AwhqNoHVLlJElJBuOZX1gwDm7NZEHEZb7SteZAbwgjEVE1mmDZBD8lKxgZw3lDtAEuNEsqDaMRsAZa5KgEhg==.AHKodTVwWKr7zZ+/ffbbjQA9vNjmt52ULl+k9EoWGhkW',
  'SPC_ST=bzdDZzBmTGE1Wmw1VFllY6fM3Yc3o3Aa37OzX8M3En32dPanSMbfX9f6xDVO9ATC3IKgjvhFXlEdgd6iY0ksm1b/o55/OE9ED9M66fn6KuShcXlT6jS6dm5K0C8mEpQ+z9eRk20UFielBq9aV119/ZovdTpT07kIAN4V3j6lhrAYDeVamdHG7atUE64IqrtwdASeH7ORb6LGWMXwyqOEsMzujkbzxlddFO94TT7gixU=.AKj1A+FPZTpAzyZ+SQIAiMX6w6Mrd8Hhej4ZMl6Q2vRo',
  'SPC_ST=YUhKbVhaUWNKcHlyeDFXNN4kxLREpQ1bjjX+/EWulzwqgP0oAHZr8uM27nrthmOU4+bO2uatc5UN93RhkRQXnkrclpXQvr8X5hsLEFoiolBxytk/u3mo3gezeyY9apqQJxJfEKPsuZNG9vxqJlZyT1pZBEdn77qt3TDHkT3GcptEFggYdd1xErNIi7DePOD+uTX/Frv3I6ahNvmVdoYVhQ==.ANK0bLvSAdqulrpA1KzRRzULQis7yhRLTsXktkIuadio',
  'SPC_ST=VUxlRGV0MFhnZ3BFSlZWZk4ILg+CY6iYTIB+JEgqHdWFFePlSJldImC852y7KZkHUYa1qKUW9aD2aYWWluwSU3t4ZVVbPXN21waQEQFaF7NxeOsEXkEEmB2ZWL96kMDua98+CDvtkJn0KhKqvaiLFpbYymfKmodxadTVEdZxsJ5ZjEt8Y2KAr2T7c0tfgT0ZIhe3A3AU/CHQbXvpgclqGA==.AMLmQcYisnoeyMJwJ0ngfmezYYpX6a5qIBar60MWpykR',
  'SPC_ST=OFlUdzU4OHhlTUprQVB1NX0iM8mCoDXvKNKRl3vvIRHOVUR+R2ZL7yyWsKnIAJtA3fRaEpsl8DjYmy3I1T/1X1eYZIcGbhYxj2f0Tpnb6GYCbQqYhr2ClFNQ1DYuQhVfpS4KMfosDUY2U5z4cuVrDzUr7FIY+/vlUH9iwjrwLBscVZSrIPH5Q5V1iwtl7Cnkf3N1SXeYHgS1W7EUzGGLvg==.AI3xVs5GHjDcv/rA7/HgclVK1bMCBERzDFsW5rkIVMWB',
  'SPC_ST=TGJRQXY3Q05UQVczNHhHd4TH3KNFXlQl83+V3p+ZREsx6Y/R4RYVZS2clmB/6u5mnfmhaxqhHn9Oe2C13nQOwY7PSFJ2ugqCvw4hwh3rQpDY3meV67aLLRzuaXeuU+Oagi6RzdfRmeJAHA4w1abO05gambJvKf8c68wqsKSk/ZdKExpJ66Xo+Fj99zUN2kplYe0PAyw00Ml9YzpNXX3xIg==.ALz6VcP3lsocWrXcoW7cRWgxED3KvVhGUMl9KVBTl6Og',
  'SPC_ST=NThXZ1A5Y2Y3Y0hweVZkdMa+5RIBHdF+obe+n3C5pClr0DW3qAj9lDT1FuPv/PwS2rw96KsaM8XxlA6EqradwsN20rTDVnDGdp49XG/Kh5jwlwIhBHMKC+tg0xp+jOdmn3GocgzFaIk7HCKq524Ub70QGahKlmOktiVoTd8aclN8ROknyr5FAiYrli4jL/Xyr3EpkQl+47QqllqonXXuaQ==.ANGRoUjh7S0t3gDglwQAhMsYrXxYfRLhAUp1AUTxUI3p',
  'SPC_ST=WE1Bb0hhR3FaTjB6NHRYY9nY1GkqaJsTcR/NPxHWf/XYJaqYeCrnXew6iCnuWqH745Dqb/kTEUTUOwdQ+jj1xXRiLJKgoQYssYe599HD4TppuPQA6HPx6YWu8UpnEK2W21EacWU+tisCK0snpS9OnvcLIsWu/QcFVzi124FcCVC5ShB6d8wfnYv56LX2dpiiypioXDh0FfYUjFugS79iTw==.AJgSmdtMvdBgVU+X9xoXwylRRd9o7DsLZsViSLQo83BG'
];

// ✅ Danh sách voucher_code
const VOUCHER_CODES = [
  "150HSAUGBANMOISHOPEE",
  "BANMOISIEUHOIAUG1",
  "200HSAUGBANMOISHOPEE"
  // ... thêm mã
];

const DELAY_MS = 100;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function requestWithCookie(cookie, voucherCode, accountIndex, voucherIndex) {
  const payload = { voucher_code: voucherCode };
  const postData = JSON.stringify(payload);

  return new Promise((resolve) => {
    const options = {
      hostname: 'shopee.vn',
      path: '/api/v2/voucher_wallet/save_platform_voucher_by_voucher_code',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(postData),
        'cookie': cookie,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
        'referer': 'https://shopee.vn/',
        'x-requested-with': 'XMLHttpRequest',
        'x-api-source': 'pc',
        'origin': 'https://shopee.vn',
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        let data = buffer.toString('utf8');

        try {
          const encoding = res.headers['content-encoding'];
          if (encoding === 'gzip') data = zlib.gunzipSync(buffer).toString('utf8');
          else if (encoding === 'deflate') data = zlib.inflateSync(buffer).toString('utf8');
          else if (encoding === 'br') data = zlib.brotliDecompressSync(buffer).toString('utf8');
        } catch (err) {
          return resolve({ accountIndex, voucherCode, success: false, error: 'decompress' });
        }

        try {
          const json = JSON.parse(data);
          resolve({ accountIndex, voucherCode, success: true, status: res.statusCode, data: json });
        } catch {
          resolve({ accountIndex, voucherCode, success: false, status: res.statusCode, raw: data.substring(0, 500) });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ accountIndex, voucherCode, success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runSequentially() {
  const totalRequests = COOKIES.length * VOUCHER_CODES.length;
  const successList = []; // Lưu lại các kết quả hợp lệ

  console.log(`🚀 Tổng: ${COOKIES.length} account × ${VOUCHER_CODES.length} voucher = ${totalRequests} request\n`);

  let requestCount = 0;

  for (let i = 0; i < COOKIES.length; i++) {
    for (let j = 0; j < VOUCHER_CODES.length; j++) {
      requestCount++;
      const result = await requestWithCookie(COOKIES[i], VOUCHER_CODES[j], i, j);
      // console.log(result)
      if (result.success && result.data?.data) {
        const invalidCode = result.data.data.invalid_message_code;

        // ✅ Chỉ hiển thị nếu invalid_message_code === 0 hoặc === 1
        if (invalidCode === 0 || invalidCode === 1) {
          console.log(`\n🎯 [HỢP LỆ] Account ${i + 1} | Voucher: "${VOUCHER_CODES[j]}" | invalid_message_code: ${invalidCode}`);
          console.log(`🔑 SPC_ST: ${COOKIES[i]}`);
          
          successList.push({
            account: i + 1,
            voucher_code: VOUCHER_CODES[j],
            invalid_message_code: invalidCode,
            cookie: COOKIES[i]
          });
        }
      }

      if (requestCount < totalRequests) {
        await sleep(DELAY_MS);
      }
    }
  }

  // 📋 Tổng kết
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🏁 Hoàn tất! Tìm thấy ${successList.length} kết quả hợp lệ (invalid_message_code: 0 hoặc 1):`);
  
  if (successList.length > 0) {
    successList.forEach((item, idx) => {
      console.log(`\n--- #${idx + 1} ---`);
      console.log(`Account: ${item.account}`);
      console.log(`Voucher: ${item.voucher_code}`);
      console.log(`invalid_message_code: ${item.invalid_message_code}`);
      console.log(`Cookie: ${item.cookie}`);
    });
  }

  // 💾 Lưu ra file JSON (tùy chọn)
  const fs = require('fs');
  fs.writeFileSync('valid_vouchers.json', JSON.stringify(successList, null, 2));
  console.log(`\n💾 Đã lưu danh sách vào: valid_vouchers.json`);
}

runSequentially().catch(console.error);