import React from 'react';

/**
 * 常用气象机构主页
 * 展示全球主要气象机构的 Logo 链接
 */
const Home: React.FC = () => {
  // 气象机构数据列表
  const meteorologicalAgencies = [
    // 第一行
    { name: 'WMO', url: 'https://wmo.int/', imgSrc: './img/WMO.png', width: 200, height: 68 },
    { name: 'ECMWF', url: 'https://www.ecmwf.int/', imgSrc: './img/ECMWF.png', width: 200, height: 40 },
    { name: 'JTWC', url: 'https://www.metoc.navy.mil/jtwc/jtwc.html', imgSrc: './img/JTWC.png', width: 106, height: 150 },
    // 第二行
    { name: 'CMA', url: 'https://www.cma.gov.cn/', imgSrc: './img/CMA.png', width: 150, height: 150 },
    { name: 'NMC', url: 'http://www.nmc.cn/', imgSrc: './img/NMC.png', width: 150, height: 150 },
    { name: 'NSMC', url: 'http://www.nsmc.org.cn/nsmc/cn/home/index.html', imgSrc: './img/NSMC.png', width: 150, height: 150 },
    // 第三行
    { name: 'HKO', url: 'https://www.hko.gov.hk/sc/index.html', imgSrc: './img/HKO.png', width: 200, height: 150 },
    { name: 'SMG', url: 'https://www.smg.gov.mo/', imgSrc: './img/SMG.png', width: 150, height: 150 },
    { name: 'CWA', url: 'https://www.cwa.gov.tw/V8/C/', imgSrc: './img/CWA.png', width: 160, height: 100 },
    // 第四行
    { name: 'NOAA', url: 'https://www.noaa.gov/', imgSrc: './img/NOAA.png', width: 150, height: 150 },
    { name: 'NWS', url: 'https://www.weather.gov/', imgSrc: './img/NWS.png', width: 150, height: 150 },
    { name: 'NCEP', url: 'https://www.weather.gov/', imgSrc: './img/NCEP.png', width: 196, height: 114 },
    // 第五行
    { name: 'JMA', url: 'https://www.jma.go.jp/jma/index.html', imgSrc: './img/JMA.png', width: 200, height: 76 },
    { name: 'KMA', url: 'https://www.kma.go.kr/', imgSrc: './img/KMA.png', width: 200, height: 78 },
    { name: 'PAGASA', url: 'http://www.pagasa.dost.gov.ph/', imgSrc: './img/PAGASA.png', width: 150, height: 150 },
    // 第六行
    { name: 'Met Office', url: 'https://www.metoffice.gov.uk/', imgSrc: './img/Met_Office.png', width: 150, height: 150 },
    { name: 'DWD', url: 'https://www.dwd.de/', imgSrc: './img/DWD.png', width: 200, height: 55 },
    { name: 'METEO FRANCE', url: 'https://meteofrance.com/', imgSrc: './img/METEO_FRANCE.png', width: 150, height: 150 },
    // 第七行
    { name: 'ABOM', url: 'http://www.bom.gov.au/', imgSrc: './img/ABOM.png', width: 200, height: 42 },
    { name: 'SMSS', url: 'https://www.weather.gov.sg/home/', imgSrc: './img/SMSS.png', width: 200, height: 56 },
    { name: 'SMB', url: 'http://sh.cma.gov.cn/', imgSrc: './img/SMB.png', width: 150, height: 150 },
  ];

  return (
    <div className="home-page">
      <h1>常用气象机构主页</h1>
      <table
        style={{
          width: '100%',
          borderSpacing: '50px',
          textAlign: 'center',
        }}
      >
        <tbody>
          {Array.from({ length: 7 }, (_, rowIndex) => {
            // 每行 3 个机构
            const rowAgencies = meteorologicalAgencies.slice(rowIndex * 3, rowIndex * 3 + 3);
            return (
              <tr key={rowIndex}>
                {rowAgencies.map((agency, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`}>
                    <a
                      href={agency.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={agency.name}
                    >
                      <img
                        src={agency.imgSrc}
                        alt={agency.name}
                        width={agency.width}
                        height={agency.height}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          // 图片加载失败时，显示机构名称作为 fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('span');
                          fallback.textContent = agency.name;
                          fallback.style.display = 'inline-block';
                          fallback.style.padding = '10px 20px';
                          fallback.style.border = '1px solid #ccc';
                          fallback.style.borderRadius = '4px';
                          target.parentNode?.insertBefore(fallback, target);
                        }}
                      />
                    </a>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Home;