package com.tradelab.stockservice;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class StockServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockServiceApplication.class, args);
    }

    /** Loads the stocks into the in-memory H2 database every time the service starts. */
    @Bean
    CommandLineRunner loadStocks(StockService stockService) {
        return args -> seed().forEach(stockService::saveStock);
    }

    private static Stock stock(String symbol, String name, String sector, String price, long marketCapCr, double pe,
                               String description, double beta, double sectorLoad, double dailyVol) {
        return new Stock(symbol, name, sector, new BigDecimal(price), marketCapCr, pe, description, beta, sectorLoad, dailyVol);
    }

    private static List<Stock> seed() {
        return List.of(
            stock("RELIANCE", "Reliance Industries", "Energy", "2890.00", 1950000L, 27.0, "Diversified conglomerate with interests in refining, petrochemicals, retail and digital services.", 1.0, 1.0, 0.0135),
            stock("ONGC", "Oil & Natural Gas Corporation", "Energy", "265.00", 333000L, 8.0, "State-owned explorer and producer of crude oil and natural gas.", 1.0, 1.1, 0.0165),
            stock("NTPC", "NTPC Limited", "Energy", "355.00", 344000L, 17.0, "Large power generation utility operating thermal and renewable capacity.", 0.9, 1.1, 0.015),
            stock("TCS", "Tata Consultancy Services", "IT", "3950.00", 1430000L, 30.0, "Global IT services, consulting and business solutions provider.", 0.75, 1.1, 0.0115),
            stock("INFY", "Infosys", "IT", "1620.00", 673000L, 25.0, "Technology services and digital transformation company.", 0.85, 1.1, 0.013),
            stock("WIPRO", "Wipro", "IT", "480.00", 251000L, 22.0, "IT services and consulting company with a global delivery footprint.", 0.9, 1.0, 0.014),
            stock("HCLTECH", "HCL Technologies", "IT", "1580.00", 429000L, 24.0, "Engineering, software and IT services group.", 0.85, 1.05, 0.0135),
            stock("HDFCBANK", "HDFC Bank", "Banking", "1690.00", 1290000L, 19.0, "Large private-sector bank with a broad retail and corporate franchise.", 1.0, 1.0, 0.012),
            stock("ICICIBANK", "ICICI Bank", "Banking", "1210.00", 850000L, 18.0, "Private-sector bank offering retail, SME and corporate banking.", 1.1, 1.0, 0.013),
            stock("SBIN", "State Bank of India", "Banking", "815.00", 727000L, 10.0, "Largest public-sector bank by assets, with a nationwide branch network.", 1.25, 1.1, 0.016),
            stock("AXISBANK", "Axis Bank", "Banking", "1120.00", 347000L, 13.0, "Private-sector bank with strong presence in corporate and retail lending.", 1.2, 1.0, 0.0155),
            stock("KOTAKBANK", "Kotak Mahindra Bank", "Banking", "1780.00", 354000L, 20.0, "Private-sector bank with allied asset management and insurance businesses.", 1.0, 1.0, 0.013),
            stock("ITC", "ITC Limited", "FMCG", "465.00", 582000L, 26.0, "Consumer goods group spanning cigarettes, foods, hotels and paperboards.", 0.6, 0.9, 0.011),
            stock("HINDUNILVR", "Hindustan Unilever", "FMCG", "2420.00", 568000L, 55.0, "Household and personal-care products company.", 0.55, 1.0, 0.0105),
            stock("NESTLEIND", "Nestlé India", "FMCG", "2510.00", 242000L, 70.0, "Packaged foods and beverages maker.", 0.55, 1.0, 0.011),
            stock("TATAMOTORS", "Tata Motors", "Auto", "940.00", 346000L, 9.0, "Automobile manufacturer of passenger and commercial vehicles.", 1.35, 1.1, 0.0185),
            stock("MARUTI", "Maruti Suzuki India", "Auto", "12400.00", 390000L, 26.0, "Leading passenger car manufacturer in India.", 0.95, 1.0, 0.013),
            stock("M&M", "Mahindra & Mahindra", "Auto", "2850.00", 354000L, 28.0, "Utility vehicles, tractors and farm equipment maker.", 1.1, 1.0, 0.015),
            stock("SUNPHARMA", "Sun Pharmaceutical Industries", "Pharma", "1720.00", 413000L, 36.0, "Specialty and generic pharmaceutical company.", 0.7, 1.0, 0.0125),
            stock("DRREDDY", "Dr. Reddy's Laboratories", "Pharma", "6250.00", 104000L, 20.0, "Global generics and pharmaceutical services company.", 0.65, 1.0, 0.0125),
            stock("LT", "Larsen & Toubro", "Infrastructure", "3580.00", 492000L, 32.0, "Engineering, construction and technology conglomerate.", 1.05, 1.0, 0.0135),
            stock("BHARTIARTL", "Bharti Airtel", "Telecom", "1540.00", 920000L, 60.0, "Telecommunications operator with mobile, broadband and enterprise services.", 0.8, 1.0, 0.0125),
            stock("TITAN", "Titan Company", "Consumer", "3420.00", 304000L, 90.0, "Jewellery, watches and eyewear retailer.", 1.0, 1.0, 0.015),
            stock("ASIANPAINT", "Asian Paints", "Consumer", "2780.00", 267000L, 55.0, "Decorative paints and home-improvement products company.", 0.75, 1.0, 0.013),
            stock("ADANIENT", "Adani Enterprises", "Conglomerate", "2980.00", 343000L, 70.0, "Business incubator with interests in mining, airports and infrastructure.", 1.3, 1.0, 0.021),
            stock("TATASTEEL", "Tata Steel", "Metals", "155.00", 193000L, 45.0, "Integrated steel producer with global operations.", 1.3, 1.1, 0.0175),
            stock("JSWSTEEL", "JSW Steel", "Metals", "920.00", 225000L, 28.0, "Steel manufacturer with a large domestic capacity.", 1.2, 1.1, 0.0165));
    }
}
